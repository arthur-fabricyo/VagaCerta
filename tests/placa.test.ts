import { describe, expect, it } from "vitest";
import { placaSchema } from "../lib/placa";

describe("placa brasileira", () => {
  it.each([
    [" abc-1234 ", "ABC1234"],
    ["abc 1d23", "ABC1D23"],
  ])("normaliza %s", (entrada, esperada) => {
    expect(placaSchema.parse(entrada)).toBe(esperada);
  });

  it.each(["AB12345", "ABC1D234", "ABC_1234", "ÁBC1234", "ßBC123"])(
    "rejeita %s",
    (entrada) => expect(placaSchema.safeParse(entrada).success).toBe(false),
  );
});
