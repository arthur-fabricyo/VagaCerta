import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import type { ResultadoCobranca } from "../cobranca";
import type { ValidatedPhoto } from "../photos/photo-validation";
import type { RateInput, UnitInput, VisitFilter, VisitInput } from "./contracts";

const unitSelect = { id: true, nome: true, fuso: true } as const;
const operatorSelect = { id: true, name: true } as const;
const visitSelect = {
  id: true,
  unidadeId: true,
  placa: true,
  placaSugeridaIa: true,
  confiancaIa: true,
  observacao: true,
  fotoMime: true,
  status: true,
  entradaEm: true,
  saidaEm: true,
  duracaoSeg: true,
  cobravelSeg: true,
  blocos: true,
  valorCentavos: true,
  unidade: { select: unitSelect },
  tarifa: true,
  operadorEntrada: { select: operatorSelect },
  operadorSaida: { select: operatorSelect },
} satisfies Prisma.VisitaSelect;

const confidenceValues = { low: "baixa", medium: "media", high: "alta" } as const;

export function isDuplicateRecord(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function readClock(database: Prisma.TransactionClient) {
  const [row] = await database.$queryRaw<[{ timestamp: Date }]>`
    SELECT date_trunc('milliseconds', clock_timestamp()) AS timestamp
  `;
  return row.timestamp;
}

async function lockUnit(transaction: Prisma.TransactionClient, unitId: string) {
  // Rate publication and entry registration use the same lock to order tariff changes and entries.
  const records = await transaction.$queryRaw<{ id: string }[]>`
    SELECT id FROM unidades WHERE id = ${unitId}::uuid FOR UPDATE
  `;
  return records.length === 1;
}

export class OperationsRepository {
  constructor(private readonly database: PrismaClient) {}

  async listUnits() {
    const at = await readClock(this.database);
    return this.database.unidade.findMany({
      orderBy: { nome: "asc" },
      select: {
        ...unitSelect,
        tarifas: { where: { vigenteDesde: { lte: at } }, orderBy: { vigenteDesde: "desc" }, take: 1 },
      },
    });
  }

  createUnit(input: UnitInput) {
    return this.database.unidade.create({
      data: { nome: input.name, fuso: input.timeZone },
      select: unitSelect,
    });
  }

  publishRate(unitId: string, input: RateInput) {
    return this.database.$transaction(async (transaction) => {
      if (!(await lockUnit(transaction, unitId))) return null;

      const effectiveAt = await readClock(transaction);
      return transaction.tarifa.create({
        data: {
          unidadeId: unitId,
          modo: input.mode === "blocks" ? "blocos" : "proporcional",
          precoCentavos: input.priceCents,
          blocoMinutos: input.blockMinutes ?? null,
          toleranciaMinutos: input.graceMinutes,
          toleranciaModo: input.graceMode === "deduct" ? "desconta" : "cobra_total",
          vigenteDesde: effectiveAt,
        },
      });
    });
  }

  listOpenVisits(filter: VisitFilter) {
    return this.database.unidade.findUnique({
      where: { id: filter.unitId },
      select: {
        visitas: {
          where: { placa: filter.plate, status: "aberta" },
          orderBy: [{ entradaEm: "desc" }, { id: "desc" }],
          select: visitSelect,
        },
      },
    });
  }

  registerEntry(input: VisitInput, operatorId: string, photo: ValidatedPhoto | null) {
    return this.database.$transaction(async (transaction) => {
      if (!(await lockUnit(transaction, input.unitId))) return { kind: "missingUnit" } as const;

      const existing = await transaction.visita.findFirst({
        where: { unidadeId: input.unitId, placa: input.plate, status: "aberta" },
        select: visitSelect,
      });
      if (existing) return { kind: "duplicate", visit: existing } as const;

      const enteredAt = await readClock(transaction);
      const rate = await transaction.tarifa.findFirst({
        where: { unidadeId: input.unitId, vigenteDesde: { lte: enteredAt } },
        orderBy: { vigenteDesde: "desc" },
        select: { id: true },
      });
      if (!rate) return { kind: "missingRate" } as const;

      const visit = await transaction.visita.create({
        data: {
          unidadeId: input.unitId,
          tarifaId: rate.id,
          placa: input.plate,
          observacao: input.note || null,
          placaSugeridaIa: input.suggestedPlate,
          confiancaIa: input.confidence ? confidenceValues[input.confidence] : null,
          foto: photo?.bytes,
          fotoMime: photo?.mimeType,
          operadorEntradaId: operatorId,
          entradaEm: enteredAt,
        },
        select: visitSelect,
      });
      return { kind: "created", visit } as const;
    });
  }

  findVisit(id: string) {
    return this.database.visita.findUnique({ where: { id }, select: visitSelect });
  }

  readClock() {
    return readClock(this.database);
  }

  cancelVisit(id: string) {
    return this.database.visita.updateMany({ where: { id, status: "aberta" }, data: { status: "cancelada" } });
  }

  closeVisit(id: string, operatorId: string, exitedAt: Date, charge: ResultadoCobranca) {
    return this.database.visita.updateMany({
      where: { id, status: "aberta" },
      data: { status: "encerrada", operadorSaidaId: operatorId, saidaEm: exitedAt, ...charge },
    });
  }
}

export type StoredVisit = Prisma.VisitaGetPayload<{ select: typeof visitSelect }>;
export type StoredRate = StoredVisit["tarifa"];
export type StoredUnit = StoredVisit["unidade"];
