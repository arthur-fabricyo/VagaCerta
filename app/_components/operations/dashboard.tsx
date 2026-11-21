"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardMetrics } from "./dashboard-metrics";
import { EntryForm } from "./entry-form";
import { UnitLoadState, useUnits } from "./units";
import { Yard } from "./yard";

type Section = "today" | "entry" | "yard";
const titles = { today: "Dashboard", entry: "Registrar reserva", yard: "Pátio" };

export function OperationsDashboard({ operatorName, selectedUnitId, section }: {
  operatorName: string;
  selectedUnitId?: string;
  section: Section;
}) {
  const router = useRouter();
  const { unit, loading, error, retry } = useUnits(selectedUnitId);

  return (
    <main className="operator-page">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="operator-page-title">
            {section === "today" ? `Olá, ${operatorName}!` : titles[section]}
          </h1>
        </div>
      </header>
      {loading || error ? (
        <UnitLoadState loading={loading} error={error} retry={retry} />
      ) : unit ? (
        <>
          {section === "today" && <DashboardMetrics key={unit.id} unitId={unit.id} />}
          {section === "entry" && <EntryForm key={unit.id} unit={unit} onOpenSettings={() => router.push(`/settings/rates/new?unitId=${encodeURIComponent(unit.id)}`)} />}
          {section === "yard" && <Yard key={unit.id} unit={unit} />}
        </>
      ) : (
        <section className="painel space-y-4">
          <p>Cadastre uma unidade para começar a operar o estacionamento.</p>
          <Link className="botao botao-primario" href="/settings/units/new">Cadastrar unidade</Link>
        </section>
      )}
    </main>
  );
}
