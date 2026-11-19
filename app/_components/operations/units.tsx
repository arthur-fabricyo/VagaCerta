"use client";

import { useEffect, useState } from "react";
import { messageFor, request, type Unit } from "./api";

export function useUnits(selectedUnitId?: string) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    request<{ units: Unit[] }>("/api/units", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setUnits(result.units);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(messageFor(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  function retry() {
    setError("");
    setLoading(true);
    setLoadAttempt((previous) => previous + 1);
  }

  function updateUnit(updated: Unit) {
    setUnits((previous) => [...previous.filter((unit) => unit.id !== updated.id), updated]
      .sort((first, second) => first.name.localeCompare(second.name, "pt-BR")));
  }

  return {
    units,
    unit: units.find((unit) => unit.id === selectedUnitId) ?? units[0],
    loading,
    error,
    retry,
    updateUnit,
  };
}

export function UnitSelector({ units, unit, onChange }: {
  units: Unit[];
  unit: Unit;
  onChange: (id: string) => void;
}) {
  return (
    <label className="campo w-full max-w-xs">
      Unidade em operação
      <select value={unit.id} onChange={(event) => onChange(event.target.value)}>
        {units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  );
}

export function UnitLoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className="painel">Carregando unidades…</p>;
  return (
    <div className="painel space-y-3">
      <p role="alert" className="text-rose-700">{error}</p>
      <button type="button" className="botao" onClick={retry}>Tentar novamente</button>
    </div>
  );
}
