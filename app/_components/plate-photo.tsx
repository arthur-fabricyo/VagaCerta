"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { invalidPhotoMessage, MAX_PHOTO_BYTES, type PlateConfidence } from "../../lib/photos/photo-contract";

export interface PlatePhotoValue {
  photo: File | null;
  suggestedPlate: string | null;
  confidence: PlateConfidence | null;
}

interface PlatePhotoProps {
  onChange: (value: PlatePhotoValue) => void;
  onSuggestion: (plate: string) => void;
  disabled?: boolean;
}

const emptyPhoto: PlatePhotoValue = { photo: null, suggestedPlate: null, confidence: null };
const confidenceLabels: Record<PlateConfidence, string> = { low: "baixa", medium: "média", high: "alta" };

async function compressPhoto(input: File) {
  if (input.type !== "image/jpeg" && input.type !== "image/png") throw new Error(invalidPhotoMessage);
  const image = await createImageBitmap(input);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error(invalidPhotoMessage);

    for (const maxEdge of [1600, 1200, 800]) {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      if (blob && blob.type === "image/jpeg" && blob.size <= MAX_PHOTO_BYTES) {
        return new File([blob], "reservation.jpg", { type: "image/jpeg" });
      }
    }
    throw new Error(invalidPhotoMessage);
  } finally {
    image.close();
  }
}

export function PlatePhoto({ onChange, onSuggestion, disabled }: PlatePhotoProps) {
  const [value, setValue] = useState<PlatePhotoValue>(emptyPhoto);
  const [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState<"prepare" | "read" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const activeRead = useRef<AbortController | null>(null);
  const selection = useRef(0);

  useEffect(() => {
    if (!value.photo) return;
    const url = URL.createObjectURL(value.photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.photo]);

  useEffect(() => () => {
    selection.current += 1;
    activeRead.current?.abort();
  }, []);

  function update(next: PlatePhotoValue) {
    setValue(next);
    onChange(next);
  }

  function clearPhoto() {
    selection.current += 1;
    activeRead.current?.abort();
    setPreview(undefined);
    setNotice("");
    setError("");
    setBusy(null);
    update(emptyPhoto);
  }

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!selected) return;

    clearPhoto();
    const currentSelection = selection.current;
    setBusy("prepare");
    try {
      const photo = await compressPhoto(selected);
      if (selection.current === currentSelection) update({ ...emptyPhoto, photo });
    } catch {
      if (selection.current === currentSelection) setError(invalidPhotoMessage);
    } finally {
      if (selection.current === currentSelection) setBusy(null);
    }
  }

  async function requestSuggestion() {
    if (!value.photo) return;
    const controller = new AbortController();
    activeRead.current = controller;
    setBusy("read");
    setNotice("");
    setError("");
    const fallback = "Não foi possível ler a foto. Digite a placa para continuar.";
    const form = new FormData();
    form.set("photo", value.photo);

    try {
      const response = await fetch("/api/ai/plate", { method: "POST", body: form, signal: controller.signal });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setError(result.error ?? fallback);
        return;
      }

      const suggestedPlate = result.suggestedPlate as string | null;
      const confidence = result.confidence as PlateConfidence | null;
      update({ photo: value.photo, suggestedPlate, confidence });
      if (suggestedPlate) {
        const confidenceText = confidence ? ` Confiança ${confidenceLabels[confidence]}.` : "";
        setNotice(`Placa sugerida: ${suggestedPlate}.${confidenceText} ${result.observation ?? ""}`.trim());
      } else {
        setNotice(result.observation ? `${result.observation} Digite a placa para continuar.` : fallback);
      }
    } catch {
      if (!controller.signal.aborted) setError(fallback);
    } finally {
      if (!controller.signal.aborted) setBusy(null);
    }
  }

  const { suggestedPlate } = value;
  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4" disabled={disabled}>
      <legend className="px-1 text-sm font-medium">Foto da reserva (opcional)</legend>
      <p className="text-sm text-slate-600">O IA pode errar. Confira a placa antes de registrar.</p>
      <div className="flex flex-wrap gap-2">
        <label className="botao cursor-pointer focus-within:ring-2 focus-within:ring-emerald-600">
          Tirar foto
          <input className="sr-only" type="file" accept="image/jpeg,image/png" capture="environment" onChange={selectPhoto} />
        </label>
        <label className="botao cursor-pointer focus-within:ring-2 focus-within:ring-emerald-600">
          Enviar imagem
          <input className="sr-only" type="file" accept="image/jpeg,image/png" onChange={selectPhoto} />
        </label>
      </div>
      {value.photo && preview && (
        // The preview URL points to a local file that has not been uploaded yet.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Prévia da foto da reserva" className="max-h-56 max-w-full rounded-lg object-contain" />
      )}
      {value.photo && (
        <div className="flex flex-wrap gap-2">
          <button className="botao" type="button" onClick={requestSuggestion} disabled={busy !== null}>Ler placa com IA</button>
          <button className="botao" type="button" onClick={clearPhoto}>Remover foto</button>
        </div>
      )}
      <p aria-live="polite" className={busy || notice ? "text-sm text-slate-700" : "sr-only"}>
        {busy === "prepare" ? "Preparando foto…" : busy === "read" ? "Lendo placa com IA…" : notice}
      </p>
      {suggestedPlate && (
        <button className="botao" type="button" disabled={busy !== null} onClick={() => onSuggestion(suggestedPlate)}>
          Usar placa sugerida
        </button>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </fieldset>
  );
}
