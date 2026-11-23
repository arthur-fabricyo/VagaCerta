"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Unit } from "./api";
import { UnitSettings } from "./unit-settings";
import { UnitLoadState, UnitSelector, useUnits } from "./units";

export function UnitSettingsPage({ selectedUnitId }: { selectedUnitId?: string }) {
  const router = useRouter();
  const { units, unit, loading, error, retry, updateUnit } = useUnits(selectedUnitId);
  const [status, setStatus] = useState("");

  function selectUnit(unitId: string) {
    router.replace(`/settings?unitId=${encodeURIComponent(unitId)}`, { scroll: false });
  }

  function handleUnitChange(updated: Unit, reason: "created" | "rate") {
    updateUnit(updated);
    if (reason === "created") selectUnit(updated.id);
    setStatus(reason === "created"
      ? `Unidade ${updated.name} cadastrada.`
      : `Nova tarifa publicada para ${updated.name}.`);
  }

  if (loading || error) return <UnitLoadState loading={loading} error={error} retry={retry} />;

  return (
    <section aria-labelledby="unit-settings-heading" className="space-y-5">
      <div className="painel space-y-4">
        <h2 id="unit-settings-heading" className="text-xl font-semibold">Unidades e tarifas</h2>
        {unit && <UnitSelector units={units} unit={unit} onChange={selectUnit} />}
      </div>
      <p role="status" className="text-emerald-800 empty:hidden">{status}</p>
      <UnitSettings key={unit?.id ?? "new"} unit={unit} onUnitChange={handleUnitChange} />
    </section>
  );
}
