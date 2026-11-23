import { getDb } from "../db";

export function findVisitPhoto(id: string) {
  return getDb().visita.findUnique({
    where: { id },
    select: { foto: true, fotoMime: true },
  });
}
