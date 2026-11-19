import { withOperator } from "../../../../lib/operations/http";
import { invalidPhotoMessage, MAX_PHOTO_BYTES } from "../../../../lib/photos/photo-contract";
import { validatePhoto } from "../../../../lib/photos/photo-validation";
import { readPlate } from "../../../../lib/photos/plate-reading-service";

export const runtime = "nodejs";

function invalidPhoto() {
  return Response.json({ error: invalidPhotoMessage }, { status: 400 });
}

export function POST(request: Request) {
  return withOperator(request, async () => {
    if (Number(request.headers.get("content-length")) > MAX_PHOTO_BYTES + 4_096) {
      return Response.json({ error: invalidPhotoMessage }, { status: 413 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("photo");
    if (!(file instanceof Blob)) return invalidPhoto();
    const photo = await validatePhoto(file);
    if (!photo) return invalidPhoto();

    const result = await readPlate(photo, request.signal);
    if (result.kind === "limit") {
      return Response.json({ error: "O limite de leitura do Grok foi atingido. Digite a placa para continuar." }, { status: 429 });
    }
    if (result.kind === "unavailable") {
      return Response.json({ error: "A leitura da foto está indisponível. Digite a placa para continuar." }, { status: 503 });
    }

    return Response.json({
      suggestedPlate: result.suggestedPlate,
      confidence: result.confidence,
      observation: result.observation,
    });
  });
}
