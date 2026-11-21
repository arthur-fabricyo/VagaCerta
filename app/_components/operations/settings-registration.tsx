"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "../empty-state";
import type { Unit } from "./api";
import { UnitSettings } from "./unit-settings";
import { UnitLoadState, useUnits } from "./units";

export function SettingsRegistration({ mode, selectedUnitId }: { mode: "unit" | "rate"; selectedUnitId?: string }) {
  const router = useRouter();
  const { unit, loading, error, retry } = useUnits(selectedUnitId);
  const settingsHref = unit ? `/settings?unitId=${encodeURIComponent(unit.id)}` : "/settings";

  function handleUnitChange(updated: Unit) {
    window.dispatchEvent(new Event("vagacerta:units-changed"));
    router.push(`/settings?unitId=${encodeURIComponent(updated.id)}`);
  }

  return (
    <main className="operator-page">
      <header className="space-y-2">
        <h1 className="operator-page-title">{mode === "unit" ? "Cadastrar unidade" : "Cadastrar tarifa"}</h1>
        <Link className="link" href={settingsHref}>Voltar às configurações</Link>
      </header>
      {loading || error ? <UnitLoadState loading={loading} error={error} retry={retry} />
        : mode === "rate" && !unit ? (
          <EmptyState icon={<Building2 />} title="Cadastre uma unidade primeiro"
            description="É necessário ter uma unidade para publicar uma tarifa.">
            <Link className="botao botao-primario" href="/settings/units/new">Cadastrar unidade</Link>
          </EmptyState>
        ) : <UnitSettings key={`${mode}-${unit?.id ?? "new"}`} mode={mode} unit={unit} onUnitChange={handleUnitChange} />}
    </main>
  );
}
