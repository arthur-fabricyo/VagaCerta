"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EntryForm } from "./entry-form";
import { UnitSettings } from "./unit-settings";
import { Yard } from "./yard";
import { messageFor, request, type Unit } from "./api";

const sections = [
  { id: "entry", label: "Entrada" },
  { id: "yard", label: "Pátio" },
  { id: "settings", label: "Unidades e tarifas" },
] as const;

type Section = (typeof sections)[number]["id"];

export function OperationsDashboard({ initialUnitId = "", initialSection = "entry" }: {
  initialUnitId?: string;
  initialSection?: Section;
}) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitId, setUnitId] = useState(initialUnitId);
  const [section, setSection] = useState<Section>(initialSection);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const unit = units.find((item) => item.id === unitId) ?? units[0];

  useEffect(() => {
    const controller = new AbortController();
    request<{ units: Unit[] }>("/api/units", { signal: controller.signal })
      .then((result) => {
        setUnits(result.units);
        if (result.units.length === 0) setSection("settings");
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(messageFor(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  function updateUnit(updated: Unit, reason: "created" | "rate") {
    setUnits((previous) => [...previous.filter((item) => item.id !== updated.id), updated]
      .sort((first, second) => first.name.localeCompare(second.name, "pt-BR")));
    if (reason === "created") setUnitId(updated.id);
    setStatus(reason === "created"
      ? `Unidade ${updated.name} cadastrada.`
      : `Nova tarifa publicada para ${updated.name}.`);
  }

  function retry() {
    setError("");
    setLoading(true);
    setLoadAttempt((previous) => previous + 1);
  }

  return (
    <div className="mt-8 space-y-5">
      <section aria-labelledby="operation-heading" className="painel space-y-5">
        <h2 id="operation-heading" className="text-xl font-semibold">Operação do estacionamento</h2>
        {loading && <p role="status">Carregando unidades…</p>}
        {error && (
          <div className="space-y-3">
            <p role="alert" className="text-rose-300">{error}</p>
            <button type="button" className="botao" onClick={retry}>Tentar novamente</button>
          </div>
        )}
        {units.length > 0 && (
          <label className="campo max-w-md">
            Unidade em operação
            <select value={unit?.id ?? ""} onChange={(event) => setUnitId(event.target.value)}>
              {units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        )}
        {!loading && !error && (
          <nav className="flex flex-wrap gap-2" aria-label="Operação">
            {sections.map((item) => (
              <button
                type="button" key={item.id} aria-pressed={section === item.id}
                className={section === item.id ? "botao botao-primario" : "botao"}
                onClick={() => setSection(item.id)}
              >
                {item.label}
              </button>
            ))}
            <Link className="botao" href={unit ? `/history?unitId=${encodeURIComponent(unit.id)}` : "/history"}>
              Histórico
            </Link>
          </nav>
        )}
      </section>
      <p role="status" className="text-emerald-200 empty:hidden">{status}</p>
      {!loading && !error && (
        <>
          {section === "settings" && <UnitSettings key={unit?.id ?? "new"} unit={unit} onUnitChange={updateUnit} />}
          {section !== "settings" && !unit && (
            <p className="painel">Cadastre uma unidade em Unidades e tarifas para começar.</p>
          )}
          {section === "entry" && unit && (
            <EntryForm key={unit.id} unit={unit} onOpenSettings={() => setSection("settings")} />
          )}
          {section === "yard" && unit && <Yard key={unit.id} unit={unit} />}
        </>
      )}
    </div>
  );
}
