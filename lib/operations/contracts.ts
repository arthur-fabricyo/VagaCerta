import { z } from "zod";
import { placaSchema } from "../placa";

export const databaseIntegerMax = 2_147_483_647;
export const idSchema = z.uuid("Identificador inválido.");

export const unitInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  timeZone: z.string().trim().min(1).max(100).transform((timeZone, context) => {
    try {
      if (!/^[+-]/.test(timeZone)) {
        return new Intl.DateTimeFormat("pt-BR", { timeZone }).resolvedOptions().timeZone;
      }
    } catch {
      // Intl rejects unrecognized zone identifiers.
    }
    context.addIssue({ code: "custom", message: "Informe um fuso horário IANA válido." });
    return z.NEVER;
  }),
});

const rateFields = {
  priceCents: z.int().min(1).max(databaseIntegerMax),
  graceMinutes: z.int().min(0).max(databaseIntegerMax),
  graceMode: z.enum(["charge_total", "deduct"]),
};

export const rateInputSchema = z.discriminatedUnion("mode", [
  z.strictObject({ ...rateFields, mode: z.literal("proportional"), blockMinutes: z.null().optional() }),
  z.strictObject({ ...rateFields, mode: z.literal("blocks"), blockMinutes: z.int().min(1).max(databaseIntegerMax) }),
]);

export const visitFilterSchema = z.object({ unitId: idSchema, plate: placaSchema.optional() });
export const visitActionSchema = z.strictObject({ action: z.enum(["exit", "cancel"]) });
export const visitInputSchema = z.strictObject({
  unitId: idSchema,
  plate: placaSchema,
  note: z.string().trim().max(2000).nullish(),
  suggestedPlate: placaSchema.nullish(),
  confidence: z.enum(["low", "medium", "high"]).nullish(),
  photo: z.strictObject({
    base64: z.string(),
    mimeType: z.enum(["image/jpeg", "image/png"]),
  }).nullish(),
});

export type UnitInput = z.infer<typeof unitInputSchema>;
export type RateInput = z.infer<typeof rateInputSchema>;
export type VisitFilter = z.infer<typeof visitFilterSchema>;
export type VisitAction = z.infer<typeof visitActionSchema>["action"];
export type VisitInput = z.infer<typeof visitInputSchema>;

export class OperationError extends Error {
  constructor(readonly kind: "invalid" | "missing" | "conflict", message: string) {
    super(message);
  }
}
