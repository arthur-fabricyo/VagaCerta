import sharp from "sharp";
import { MAX_PHOTO_BYTES, type PhotoMimeType } from "./photo-contract";

export { MAX_PHOTO_BYTES } from "./photo-contract";

export interface ValidatedPhoto {
  bytes: Uint8Array<ArrayBuffer>;
  mimeType: PhotoMimeType;
}

export async function validatePhoto(photo: Blob): Promise<ValidatedPhoto | null> {
  if (!photo.size || photo.size > MAX_PHOTO_BYTES) return null;
  if (photo.type !== "image/jpeg" && photo.type !== "image/png") return null;

  const bytes = new Uint8Array(await photo.arrayBuffer());
  try {
    const image = sharp(bytes, { limitInputPixels: 12_000_000, failOn: "warning" });
    const { format } = await image.metadata();
    if (photo.type !== `image/${format}`) return null;
    await image.stats();
    return { bytes, mimeType: photo.type };
  } catch {
    return null;
  }
}
