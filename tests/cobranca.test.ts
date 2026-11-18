import { describe, expect, it } from "vitest";
import { calcularCobranca, type TarifaCobranca } from "../lib/cobranca";

const proporcional = {
  modo: "proporcional",
  precoCentavos: 800,
  toleranciaMinutos: 0,
  toleranciaModo: "cobra_total",
} satisfies TarifaCobranca;

const entrada = new Date("2026-11-18T10:05:00-03:00");

describe("cobrança de estacionamento", () => {
  it("usa a data completa ao cruzar a meia-noite", () => {
    expect(calcularCobranca(
      new Date("2026-11-18T23:40:00-03:00"),
      new Date("2026-11-19T00:10:00-03:00"),
      proporcional,
    )).toEqual({ duracaoSeg: 1800, cobravelSeg: 1800, blocos: null, valorCentavos: 400 });
  });

  it("cobra 75 minutos proporcionalmente", () => {
    const saida = new Date("2026-11-18T11:20:00-03:00");
    expect(calcularCobranca(entrada, saida, proporcional)).toMatchObject({ valorCentavos: 1000 });
  });

  it("cobra por bloco iniciado", () => {
    const saida = new Date("2026-11-18T11:20:00-03:00");
    const tarifa = { ...proporcional, modo: "blocos" as const, blocoMinutos: 60 };
    expect(calcularCobranca(entrada, saida, tarifa)).toMatchObject({ blocos: 2, valorCentavos: 1600 });
  });

  it("inicia o segundo bloco no primeiro milissegundo após o limite", () => {
    const saida = new Date("2026-11-18T11:05:00.001-03:00");
    const tarifa = { ...proporcional, modo: "blocos" as const, blocoMinutos: 60 };
    expect(calcularCobranca(entrada, saida, tarifa)).toEqual({
      duracaoSeg: 3600.001,
      cobravelSeg: 3600.001,
      blocos: 2,
      valorCentavos: 1600,
    });
  });

  it("aplica a tolerância ao intervalo real e arredonda apenas o valor final", () => {
    const saida = new Date("2026-11-18T10:15:00.500-03:00");
    const tarifa = { ...proporcional, precoCentavos: 3600, toleranciaMinutos: 10, toleranciaModo: "desconta" as const };
    expect(calcularCobranca(entrada, saida, tarifa)).toMatchObject({ cobravelSeg: 0.5, valorCentavos: 1 });
  });

  it("isenta uma visita no limite exato da tolerância", () => {
    const saida = new Date("2026-11-18T10:15:00-03:00");
    const tarifa = { ...proporcional, toleranciaMinutos: 10 };
    expect(calcularCobranca(entrada, saida, tarifa)).toMatchObject({ cobravelSeg: 0, valorCentavos: 0 });
  });

  it.each([
    ["cobra_total", 1200, 267],
    ["desconta", 600, 133],
  ] as const)("aplica %s acima da tolerância", (toleranciaModo, cobravelSeg, valorCentavos) => {
    const saida = new Date("2026-11-18T10:25:00-03:00");
    const tarifa = { ...proporcional, toleranciaMinutos: 10, toleranciaModo };
    expect(calcularCobranca(entrada, saida, tarifa)).toMatchObject({ cobravelSeg, valorCentavos });
  });

  it("arredonda meio centavo para cima", () => {
    const saida = new Date("2026-11-18T10:05:18-03:00");
    expect(calcularCobranca(entrada, saida, { ...proporcional, precoCentavos: 100 }).valorCentavos).toBe(1);
  });

  it("rejeita uma saída anterior à entrada", () => {
    expect(() => calcularCobranca(entrada, new Date(entrada.getTime() - 1), proporcional)).toThrow(RangeError);
  });
});
