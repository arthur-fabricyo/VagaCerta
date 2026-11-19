import { findVisitPhoto } from "./photo-repository";

export async function getVisitPhoto(id: string) {
  const visit = await findVisitPhoto(id);
  if (!visit?.foto?.length) return null;
  if (visit.fotoMime !== "image/jpeg" && visit.fotoMime !== "image/png") return null;
  return { bytes: visit.foto, mimeType: visit.fotoMime };
}
