export const MAX_PHOTO_BYTES = 1_000_000;

export type PhotoMimeType = "image/jpeg" | "image/png";
export type PlateConfidence = "low" | "medium" | "high";

export const invalidPhotoMessage = "Envie uma imagem JPEG ou PNG válida de até 1 MB.";
