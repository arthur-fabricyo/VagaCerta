import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, validatePhoto } from "../lib/photos/photo-validation";

function sampleImage() {
  return sharp({ create: { width: 16, height: 16, channels: 3, background: "white" } });
}

describe("visit photo validation", () => {
  it.each(["jpeg", "png"] as const)("accepts valid %s content", async (format) => {
    const mimeType = `image/${format}`;
    const bytes = new Uint8Array(await sampleImage().toFormat(format).toBuffer());
    expect(await validatePhoto(new Blob([bytes], { type: mimeType }))).toEqual({ bytes, mimeType });
  });

  it("rejects actual file content that differs from the declared MIME type", async () => {
    const png = new Uint8Array(await sampleImage().png().toBuffer());
    expect(await validatePhoto(new Blob([png], { type: "image/jpeg" }))).toBeNull();
    expect(await validatePhoto(new Blob(["fake"], { type: "image/jpeg" }))).toBeNull();
  });

  it("rejects photos over the byte limit", async () => {
    const oversized = new Blob([new Uint8Array(MAX_PHOTO_BYTES + 1)], { type: "image/png" });
    expect(await validatePhoto(oversized)).toBeNull();
  });
});
