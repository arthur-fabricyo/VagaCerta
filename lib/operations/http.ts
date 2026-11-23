import type { z } from "zod";
import { consultarAcesso } from "../acesso";
import { getAuthOrigin } from "../auth";
import { getDb } from "../db";
import { idSchema, OperationError } from "./contracts";
import { OperationsRepository } from "./repository";
import { OperationsService } from "./service";

const errorStatuses = { invalid: 400, missing: 404, conflict: 409 } as const;

export function parseInput<T>(schema: z.ZodType<T>, input: unknown, message: string): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new OperationError("invalid", message);
  return result.data;
}

export async function readInput<T>(request: Request, schema: z.ZodType<T>, message: string) {
  return parseInput(schema, await request.json().catch(() => null), message);
}

export function parseId(id: string) {
  return parseInput(idSchema, id, "Identificador inválido.");
}

export async function withOperator(
  request: Request,
  handler: (operatorId: string) => Promise<Response>,
) {
  try {
    const access = await consultarAcesso(request.headers);
    if (access.estado === "anonimo") {
      return Response.json({ error: "Entre para continuar." }, { status: 401 });
    }
    if (access.estado === "pendente") {
      return Response.json({ error: "Cadastro aguardando aprovação." }, { status: 403 });
    }
    if (request.method !== "GET" && request.headers.get("origin") !== getAuthOrigin()) {
      return Response.json({ error: "Origem da solicitação não autorizada." }, { status: 403 });
    }
    return await handler(access.usuario.id);
  } catch (error) {
    if (error instanceof OperationError) {
      return Response.json({ error: error.message }, { status: errorStatuses[error.kind] });
    }
    console.error("Parking operation failed.", error);
    return Response.json({ error: "Não foi possível concluir a operação. Tente novamente." }, { status: 500 });
  }
}

export function getOperations() {
  return new OperationsService(new OperationsRepository(getDb()));
}
