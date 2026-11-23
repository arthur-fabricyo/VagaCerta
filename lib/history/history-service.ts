import { z } from "zod";
import { placaSchema } from "../placa";
import { findPlateHistory } from "./history-repository";

export { listHistoryUnits } from "./history-repository";

const historyQuery = z.object({
  unitId: z.uuid(),
  plate: placaSchema,
  start: z.iso.date().optional(),
  end: z.iso.date().optional(),
}).refine(({ start, end }) => !start || !end || start <= end);

export async function getPlateHistory(input: unknown) {
  const parsed = historyQuery.safeParse(input);
  if (!parsed.success) return { status: "invalid" } as const;

  const { unitId, plate, start, end } = parsed.data;
  const result = await findPlateHistory(unitId, plate, start, end);
  if (!result) return { status: "missing" } as const;

  return { status: "ok", history: { ...result, plate, start, end } } as const;
}
