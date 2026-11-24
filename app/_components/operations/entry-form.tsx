"use client";

import { CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { formatPlateInput } from "../../../lib/input-format";
import { placaSchema } from "../../../lib/placa";
import { EmptyState } from "../empty-state";
import { PlateInput } from "../plate-input";
import { PlatePhoto, type PlatePhotoValue } from "../plate-photo";
import { formatPrice, messageFor, send, type Unit, type Visit } from "./api";

const emptyPhoto: PlatePhotoValue = { photo: null, suggestedPlate: null, confidence: null };

async function encodePhoto(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(new Error("Não foi possível preparar a foto.")));
    reader.readAsDataURL(file);
  });
  return { base64: dataUrl.slice(dataUrl.indexOf(",") + 1), mimeType: file.type };
}

export function EntryForm({ unit, onOpenSettings, onRegistered, showEmptyState = false }: {
  unit: Unit;
  onOpenSettings: () => void;
  onRegistered?: () => void;
  showEmptyState?: boolean;
}) {
  const [plate, setPlate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [photo, setPhoto] = useState<PlatePhotoValue>(emptyPhoto);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ visit: Visit; duplicate: boolean } | null>(null);

  function updatePlate(value: string) {
    setPlate(formatPlateInput(value));
    setConfirmed(false);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const parsed = placaSchema.safeParse(plate);
    setResult(null);
    if (!parsed.success || !confirmed) {
      setError(parsed.success ? "Confirme a placa para continuar." : "Informe uma placa brasileira válida.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await send<{ visit: Visit; duplicate: boolean }>("/api/visits", "POST", {
        unitId: unit.id,
        plate: parsed.data,
        note: String(fields.get("note") ?? "").trim() || undefined,
        suggestedPlate: photo.suggestedPlate ?? undefined,
        confidence: photo.confidence ?? undefined,
        photo: photo.photo ? await encodePhoto(photo.photo) : undefined,
      });
      setResult(response);
      onRegistered?.();
      if (!response.duplicate) {
        form.reset();
        updatePlate("");
        setPhoto(emptyPhoto);
        setPhotoVersion((previous) => previous + 1);
      }
    } catch (failure) {
      setError(messageFor(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="painel space-y-4" aria-labelledby="entry-heading">
      <h2 id="entry-heading" className="text-xl font-semibold">Registrar reserva</h2>
      {!unit.activeRate ? (
        showEmptyState ? (
          <EmptyState compact icon={<CircleDollarSign />} title="Cadastre uma tarifa"
            description="Esta unidade precisa de uma tarifa vigente para registrar reservas.">
            <button className="botao botao-primario" type="button" onClick={onOpenSettings}>Cadastrar tarifa</button>
          </EmptyState>
        ) : <>
          <p className="text-slate-600">Esta unidade precisa de uma tarifa vigente para registrar reservas.</p>
          <button className="botao" type="button" onClick={onOpenSettings}>Cadastrar tarifa</button>
        </>
      ) : (
        <>
          <p className="text-slate-600">
            Tarifa vigente de {formatPrice(unit.activeRate.priceCents)}
            {unit.activeRate.mode === "blocks" ? ` por bloco de ${unit.activeRate.blockMinutes} min.` : " por hora."}
          </p>
          {error && <p role="alert" className="text-rose-700">{error}</p>}
          {result && (
            <div role="status" className="space-y-2 rounded-lg border border-slate-300 p-3">
              <p>{result.duplicate ? "Já existe uma visita em aberto" : "Reserva registrada"} para {result.visit.plate}.</p>
              <Link className="link" href={`/visits/${result.visit.id}`}>Abrir visita</Link>
            </div>
          )}
          <form autoComplete="off" onSubmit={register} className="space-y-4" aria-busy={saving}>
            <PlatePhoto key={photoVersion} onChange={setPhoto} onSuggestion={updatePlate} disabled={saving} />
            <fieldset className="grid gap-4" disabled={saving}>
              <label className="campo max-w-xs">
                Placa
                <PlateInput required value={plate} onValueChange={updatePlate} />
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" className="size-5 accent-emerald-700 focus-visible:outline-emerald-600"
                  required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                Conferi a placa do veículo
              </label>
              <label className="campo max-w-lg">
                Observação (opcional)
                <textarea name="note" rows={3} maxLength={2000} />
              </label>
            </fieldset>
            <button className="botao botao-primario" type="submit" disabled={saving}>
              {saving ? "Registrando…" : "Registrar reserva"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
