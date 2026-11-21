import { describe, expect, it } from "vitest";
import { formatPlateInput, formatCurrencyInput, currencyInputToCents, removeCurrencyDigit } from "../lib/input-format";

describe("input formatting", () => {
  it.each([
    ["abc1234", "ABC-1234"],
    ["abc1d23", "ABC-1D23"],
    ["AB", "AB"],
    ["ABC-", "ABC"],
    ["ABC 1D23", "ABC-1D23"],
    ["ÁBC1234", "ÁBC-1234"],
  ])("formats plate %s as %s", (value, expected) => {
    expect(formatPlateInput(value)).toBe(expected);
  });

  it("deletes currency digits down to an empty input", () => {
    expect(removeCurrencyDigit("1,00")).toBe("0,10");
    expect(removeCurrencyDigit("0,10")).toBe("0,01");
    expect(removeCurrencyDigit("0,01")).toBe("");
    expect(removeCurrencyDigit("0,00")).toBe("");
  });

  it.each([
    ["", "", null], ["1", "0,01", 1], ["100", "1,00", 100],
    ["123456", "1.234,56", 123456], ["2147483647", "21.474.836,47", 2147483647],
    ["0", "0,00", 0],
  ])("formats currency %s as %s and converts to cents", (value, formatted, cents) => {
    expect(formatCurrencyInput(value)).toBe(formatted);
    expect(currencyInputToCents(formatted)).toBe(cents);
  });
});
