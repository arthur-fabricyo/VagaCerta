import { calcularCobranca, type TarifaCobranca } from "../cobranca";
import type { ValidatedPhoto } from "../photos/photo-validation";
import { databaseIntegerMax, OperationError, type RateInput, type UnitInput, type VisitAction, type VisitFilter, type VisitInput } from "./contracts";
import { isDuplicateRecord, type OperationsRepository, type StoredRate, type StoredUnit, type StoredVisit } from "./repository";

const visitStatuses = { aberta: "open", encerrada: "closed", cancelada: "cancelled" } as const;
const confidenceValues = { baixa: "low", media: "medium", alta: "high" } as const;

function unitView(unit: StoredUnit) {
  return { id: unit.id, name: unit.nome, timeZone: unit.fuso };
}

function rateView(rate: StoredRate) {
  return {
    id: rate.id,
    mode: rate.modo === "blocos" ? "blocks" : "proportional",
    priceCents: rate.precoCentavos,
    blockMinutes: rate.blocoMinutos,
    graceMinutes: rate.toleranciaMinutos,
    graceMode: rate.toleranciaModo === "desconta" ? "deduct" : "charge_total",
    effectiveAt: rate.vigenteDesde,
  };
}

function visitView(visit: StoredVisit) {
  return {
    id: visit.id,
    unitId: visit.unidadeId,
    plate: visit.placa,
    suggestedPlate: visit.placaSugeridaIa,
    confidence: visit.confiancaIa ? confidenceValues[visit.confiancaIa as keyof typeof confidenceValues] : null,
    note: visit.observacao,
    hasPhoto: visit.fotoMime !== null,
    status: visitStatuses[visit.status as keyof typeof visitStatuses],
    enteredAt: visit.entradaEm,
    exitedAt: visit.saidaEm,
    durationSeconds: visit.duracaoSeg?.toNumber() ?? null,
    billableSeconds: visit.cobravelSeg?.toNumber() ?? null,
    blocks: visit.blocos,
    totalCents: visit.valorCentavos,
    unit: unitView(visit.unidade),
    rate: rateView(visit.tarifa),
    entryOperator: visit.operadorEntrada,
    exitOperator: visit.operadorSaida,
  };
}

function chargeRate(rate: StoredRate): TarifaCobranca {
  const config = {
    precoCentavos: rate.precoCentavos,
    toleranciaMinutos: rate.toleranciaMinutos,
    toleranciaModo: rate.toleranciaModo === "desconta" ? "desconta" as const : "cobra_total" as const,
  };
  if (rate.modo === "blocos" && rate.blocoMinutos !== null) {
    return { ...config, modo: "blocos", blocoMinutos: rate.blocoMinutos };
  }
  return { ...config, modo: "proporcional" };
}

export class OperationsService {
  constructor(private readonly repository: OperationsRepository) {}

  async listUnits() {
    const units = await this.repository.listUnits();
    return units.map((unit) => ({
      ...unitView(unit),
      activeRate: unit.tarifas[0] ? rateView(unit.tarifas[0]) : null,
    }));
  }

  async createUnit(input: UnitInput) {
    try {
      return { ...unitView(await this.repository.createUnit(input)), activeRate: null };
    } catch (error) {
      if (isDuplicateRecord(error)) throw new OperationError("conflict", "Já existe uma unidade com esse nome.");
      throw error;
    }
  }

  async publishRate(unitId: string, input: RateInput) {
    try {
      const rate = await this.repository.publishRate(unitId, input);
      if (!rate) throw new OperationError("missing", "Unidade não encontrada.");
      return rateView(rate);
    } catch (error) {
      if (isDuplicateRecord(error)) {
        throw new OperationError("conflict", "Outra tarifa acabou de ser publicada. Tente novamente.");
      }
      throw error;
    }
  }

  async listOpenVisits(filter: VisitFilter) {
    const unit = await this.repository.listOpenVisits(filter);
    if (!unit) throw new OperationError("missing", "Unidade não encontrada.");
    return unit.visitas.map(visitView);
  }

  async registerEntry(input: VisitInput, operatorId: string, photo: ValidatedPhoto | null) {
    const result = await this.repository.registerEntry(input, operatorId, photo);
    if (result.kind === "missingUnit") throw new OperationError("missing", "Unidade não encontrada.");
    if (result.kind === "missingRate") {
      throw new OperationError("conflict", "Cadastre uma tarifa vigente antes de registrar a entrada.");
    }
    return { visit: visitView(result.visit), duplicate: result.kind === "duplicate" };
  }

  async getVisit(id: string) {
    return visitView(await this.findVisit(id));
  }

  async changeVisit(id: string, action: VisitAction, operatorId: string) {
    const visit = await this.findVisit(id);
    if (visit.status === "aberta") {
      if (action === "cancel") await this.repository.cancelVisit(id);
      else await this.closeVisit(visit, operatorId);
    }

    const updated = visit.status === "aberta" ? await this.findVisit(id) : visit;
    const expectedStatus = action === "exit" ? "encerrada" : "cancelada";
    if (updated.status !== expectedStatus) {
      throw new OperationError("conflict", "A visita já foi finalizada com outra ação.");
    }
    return visitView(updated);
  }

  private async findVisit(id: string) {
    const visit = await this.repository.findVisit(id);
    if (!visit) throw new OperationError("missing", "Visita não encontrada.");
    return visit;
  }

  private async closeVisit(visit: StoredVisit, operatorId: string) {
    const exitedAt = await this.repository.readClock();
    if (exitedAt < visit.entradaEm) {
      throw new OperationError("conflict", "O horário de saída é anterior ao horário de entrada.");
    }

    const charge = calcularCobranca(visit.entradaEm, exitedAt, chargeRate(visit.tarifa));
    if (charge.valorCentavos > databaseIntegerMax || (charge.blocos ?? 0) > databaseIntegerMax) {
      throw new OperationError("conflict", "A cobrança excede o limite de armazenamento.");
    }
    await this.repository.closeVisit(visit.id, operatorId, exitedAt, charge);
  }
}
