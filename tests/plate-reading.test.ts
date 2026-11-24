import { afterEach, describe, expect, it, vi } from "vitest";
import { readPlate } from "../lib/photos/plate-reading-service";

const photo = { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" as const };

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Groq plate reading", () => {
  it("sends the image and returns a validated suggestion", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubEnv("GROQ_MODEL", "test-vision-model");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ suggestedPlate: "ABC1D23", confidence: "high", observation: null }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await readPlate(photo, new AbortController().signal)).toEqual({ kind: "completed", suggestedPlate: "ABC1D23", confidence: "high", observation: null });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("test-vision-model");
    expect(body.messages[1].content[1].image_url.url).toBe("data:image/png;base64,AQID");
  });

  it("treats quota errors as limits and malformed results as unavailable", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("", { status: 429 })).mockResolvedValueOnce(new Response("{}", { status: 200 })));
    expect(await readPlate(photo, new AbortController().signal)).toEqual({ kind: "limit" });
    expect(await readPlate(photo, new AbortController().signal)).toEqual({ kind: "unavailable" });
  });
});
