import { parseId, withOperator } from "../../../../../lib/operations/http";
import { getVisitPhoto } from "../../../../../lib/photos/photo-service";

export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return withOperator(request, async () => {
    const { id } = await context.params;
    const photo = await getVisitPhoto(parseId(id));
    if (!photo) return Response.json({ error: "Foto não encontrada." }, { status: 404 });

    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
