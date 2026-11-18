type ConfiguracaoCobranca = {
  precoCentavos: number;
  toleranciaMinutos: number;
  toleranciaModo: "cobra_total" | "desconta";
};

export type TarifaCobranca = ConfiguracaoCobranca & (
  | { modo: "proporcional" }
  | { modo: "blocos"; blocoMinutos: number }
);

export type ResultadoCobranca = {
  duracaoSeg: number;
  cobravelSeg: number;
  blocos: number | null;
  valorCentavos: number;
};

export function calcularCobranca(
  entrada: Date,
  saida: Date,
  tarifa: TarifaCobranca,
): ResultadoCobranca {
  const intervaloMs = saida.getTime() - entrada.getTime();
  if (!Number.isFinite(intervaloMs) || intervaloMs < 0) {
    throw new RangeError("Os horários da visita são inválidos.");
  }

  const toleranciaMs = tarifa.toleranciaMinutos * 60_000;
  const cobravelMs = intervaloMs <= toleranciaMs
    ? 0
    : intervaloMs - (tarifa.toleranciaModo === "desconta" ? toleranciaMs : 0);
  const duracaoSeg = intervaloMs / 1000;
  const cobravelSeg = cobravelMs / 1000;

  if (tarifa.modo === "blocos") {
    const blocos = Math.ceil(cobravelMs / (tarifa.blocoMinutos * 60_000));
    return { duracaoSeg, cobravelSeg, blocos, valorCentavos: blocos * tarifa.precoCentavos };
  }

  const msPorHora = 3_600_000n;
  const centavosVezesMs = BigInt(tarifa.precoCentavos) * BigInt(cobravelMs);
  const valorCentavos = Number((centavosVezesMs + msPorHora / 2n) / msPorHora);
  return { duracaoSeg, cobravelSeg, blocos: null, valorCentavos };
}
