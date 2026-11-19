"use client";

import { useState, type FormEvent } from "react";
import { formatPrice, formatTimestamp, messageFor, send, type Rate, type Unit } from "./api";

type SettingsProps = { unit?: Unit; onUnitChange: (unit: Unit, reason: "created" | "rate") => void };

export function UnitSettings({ unit, onUnitChange }: SettingsProps) {
  const rate = unit?.activeRate;
  const [rateMode, setRateMode] = useState<Rate["mode"]>(rate?.mode ?? "proportional");
  const [saving, setSaving] = useState<"unit" | "rate" | null>(null);
  const [error, setError] = useState("");

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setError("");
    setSaving("unit");
    try {
      const { unit: created } = await send<{ unit: Unit }>("/api/units", "POST", {
        name: fields.get("name"),
        timeZone: fields.get("timeZone"),
      });
      form.reset();
      onUnitChange(created, "created");
    } catch (failure) {
      setError(messageFor(failure));
    } finally {
      setSaving(null);
    }
  }

  async function publishRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !unit) return;
    const fields = new FormData(event.currentTarget);
    setError("");
    setSaving("rate");
    try {
      const { rate: published } = await send<{ rate: Rate }>(`/api/units/${unit.id}/rates`, "POST", {
        mode: rateMode,
        priceCents: Math.round(Number(fields.get("price")) * 100),
        ...(rateMode === "blocks" ? { blockMinutes: Number(fields.get("blockMinutes")) } : {}),
        graceMinutes: Number(fields.get("graceMinutes")),
        graceMode: fields.get("graceMode"),
      });
      onUnitChange({ ...unit, activeRate: published }, "rate");
    } catch (failure) {
      setError(messageFor(failure));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-5" aria-busy={saving !== null}>
      {error && <p role="alert" className="painel text-rose-700">{error}</p>}
      {unit && (
        <section className="painel space-y-4" aria-labelledby="rate-heading">
          <h2 id="rate-heading" className="break-words text-xl font-semibold">Tarifa de {unit.name}</h2>
          {rate ? (
            <p className="text-slate-600">
              Vigente desde {formatTimestamp(rate.effectiveAt, unit.timeZone)}. {formatPrice(rate.priceCents)}
              {rate.mode === "blocks" ? ` por bloco de ${rate.blockMinutes} min.` : " por hora."}
            </p>
          ) : <p className="text-slate-600">Cadastre a primeira tarifa para liberar as reservas nesta unidade.</p>}
          <form className="space-y-4" onSubmit={publishRate}>
            <fieldset disabled={saving !== null} className="grid gap-4 sm:grid-cols-2">
              <label className="campo">
                Modo de cobrança
                <select value={rateMode} onChange={(event) => setRateMode(event.target.value as Rate["mode"])}>
                  <option value="proportional">Proporcional ao tempo</option>
                  <option value="blocks">Por blocos iniciados</option>
                </select>
              </label>
              <label className="campo">
                {rateMode === "blocks" ? "Preço por bloco (R$)" : "Preço por hora (R$)"}
                <input name="price" type="number" min="0.01" max="21474836.47" step="0.01" required
                  defaultValue={rate ? rate.priceCents / 100 : undefined} />
              </label>
              {rateMode === "blocks" && (
                <label className="campo">
                  Duração do bloco em minutos
                  <input name="blockMinutes" type="number" min="1" max="2147483647" step="1" required
                    defaultValue={rate?.blockMinutes ?? 60} />
                </label>
              )}
              <label className="campo">
                Tolerância em minutos
                <input name="graceMinutes" type="number" min="0" max="2147483647" step="1" required
                  defaultValue={rate?.graceMinutes ?? 0} />
              </label>
              <label className="campo">
                Acima da tolerância
                <select name="graceMode" defaultValue={rate?.graceMode ?? "charge_total"}>
                  <option value="charge_total">Cobrar o tempo total</option>
                  <option value="deduct">Descontar a tolerância</option>
                </select>
              </label>
            </fieldset>
            <button type="submit" className="botao botao-primario" disabled={saving !== null}>
              {saving === "rate" ? "Publicando…" : "Publicar versão da tarifa"}
            </button>
          </form>
        </section>
      )}
      <section className="painel space-y-4" aria-labelledby="unit-heading">
        <h2 id="unit-heading" className="text-xl font-semibold">Cadastrar unidade</h2>
        <form className="space-y-4" onSubmit={createUnit}>
          <fieldset className="grid gap-4 sm:grid-cols-2" disabled={saving !== null}>
            <label className="campo">
              Nome
              <input name="name" type="text" maxLength={120} required />
            </label>
            <label className="campo">
              Fuso horário
              <input name="timeZone" type="text" list="unit-time-zones" maxLength={100}
                defaultValue="America/Sao_Paulo" required />
            </label>
            <datalist id="unit-time-zones">
              <option value="America/Sao_Paulo" />
              <option value="America/Manaus" />
              <option value="America/Recife" />
              <option value="America/Rio_Branco" />
              <option value="America/Noronha" />
            </datalist>
          </fieldset>
          <button className="botao botao-primario" type="submit" disabled={saving !== null}>
            {saving === "unit" ? "Cadastrando…" : "Cadastrar unidade"}
          </button>
        </form>
      </section>
    </div>
  );
}
