import { OperationError, visitFilterSchema, visitInputSchema, type VisitInput } from "../../../lib/operations/contracts";
import { getOperations, parseInput, readInput, withOperator } from "../../../lib/operations/http";
import { MAX_PHOTO_BYTES, validatePhoto } from "../../../lib/photos/photo-validation";

async function readPhoto(input: VisitInput["photo"]) {
  if (!input) return null;

  if (input.base64.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4) {
    throw new OperationError("invalid", "A foto deve ter até 1 MB.");
  }
  const bytes = Buffer.from(input.base64, "base64");
  if (bytes.toString("base64") !== input.base64) {
    throw new OperationError("invalid", "A foto enviada está inválida.");
  }
  const photo = await validatePhoto(new Blob([new Uint8Array(bytes)], { type: input.mimeType }));
  if (!photo) throw new OperationError("invalid", "Envie uma foto JPEG ou PNG de até 1 MB.");
  return photo;
}

export function GET(request: Request) {
  return withOperator(request, async () => {
    const query = new URL(request.url).searchParams;
    const filter = parseInput(visitFilterSchema, {
      unitId: query.get("unitId"),
      plate: query.get("plate") || undefined,
    }, "Confira a unidade e a placa pesquisada.");
    return Response.json({ visits: await getOperations().listOpenVisits(filter) });
  });
}

export function POST(request: Request) {
  return withOperator(request, async (operatorId) => {
    const input = await readInput(request, visitInputSchema, "Confira a unidade, a placa e os dados da reserva.");
    const photo = await readPhoto(input.photo);
    const result = await getOperations().registerEntry(input, operatorId, photo);
    return Response.json(result, { status: result.duplicate ? 200 : 201 });
  });
}
