"use client";

import { useState, type FormEvent } from "react";
import { currencyInputToCents, formatCurrencyInput, removeCurrencyDigit } from "@/lib/input-format";
import { TimeZoneSelect } from "./time-zone-select";
import { messageFor, send, type Rate, type Unit } from "./api";

type SettingsProps = { mode: "unit" | "rate"; unit?: Unit; onUnitChange: (unit: Unit, reason: "created" | "rate") => void };

export function UnitSettings({ mode, unit, onUnitChange }: SettingsProps) {
  const rate = unit?.activeRate;
  const [rateMode, setRateMode] = useState<Rate["mode"]>(rate?.mode ?? "proportional");
  const [price, setPrice] = useState(() => rate ? formatCurrencyInput(String(rate.priceCents)) : "");
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
    const priceCents = currencyInputToCents(price);
    if (priceCents === null || priceCents < 1 || priceCents > 2_147_483_647) {
      setError("Informe uma tarifa entre R$ 0,01 e R$ 21.474.836,47.");
      return;
    }
    setError("");
    setSaving("rate");
    try {
      const { rate: published } = await send<{ rate: Rate }>(`/api/units/${unit.id}/rates`, "POST", {
        mode: rateMode,
        priceCents,
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
    <div className="space-y-6" aria-busy={saving !== null}>
      {error && <p role="alert" className="painel text-rose-700">{error}</p>}
      {mode === "rate" && unit && (
        <section className="painel space-y-4" aria-labelledby="rate-heading">
          <h2 id="rate-heading" className="break-words text-xl font-semibold">Tarifa de {unit.name}</h2>
          <p className="text-slate-600">A nova tarifa será aplicada às reservas registradas após a publicação.</p>
          <form autoComplete="off" className="space-y-4" onSubmit={publishRate}>
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
                <input name="price" type="text" inputMode="numeric" required placeholder="0,00"
                  value={price} onChange={(event) => setPrice(formatCurrencyInput(event.target.value))}
                  onKeyDown={(event) => {
                    const input = event.currentTarget;
                    if (event.key === "Backspace" && !event.ctrlKey && !event.metaKey && !event.altKey
                      && input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
                      event.preventDefault();
                      setPrice(removeCurrencyDigit(input.value));
                    }
                  }} />
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
      {mode === "unit" && <section className="painel space-y-4" aria-labelledby="unit-heading">
        <h2 id="unit-heading" className="text-xl font-semibold">Cadastrar unidade</h2>
        <form autoComplete="off" className="space-y-4" onSubmit={createUnit}>
          <fieldset className="grid gap-4 sm:grid-cols-2" disabled={saving !== null}>
            <label className="campo">
              Nome
              <input name="name" type="text" maxLength={120} required />
            </label>
            <label className="campo">
              Fuso horário
              <TimeZoneSelect />
            </label>
          </fieldset>
          <button className="botao botao-primario" type="submit" disabled={saving !== null}>
            {saving === "unit" ? "Cadastrando…" : "Cadastrar unidade"}
          </button>
        </form>
      </section>}
    </div>
  );
}
