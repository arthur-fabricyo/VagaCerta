"use client";

import { ArrowDownToLine, Clock3, History, ParkingSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardMetrics } from "./dashboard-metrics";
import { EntryForm } from "./entry-form";
import { UnitLoadState, UnitSelector, useUnits } from "./units";
import { Yard } from "./yard";

type Section = "today" | "entry" | "yard";
const titles = { today: "Dashboard", entry: "Registrar reserva", yard: "Pátio" };

function operationUrl(unitId: string, section: Section = "today") {
  const params = new URLSearchParams({ unitId });
  if (section !== "today") params.set("section", section);
  return `/?${params}`;
}

export function OperationsDashboard({ operatorName, selectedUnitId, section }: {
  operatorName: string;
  selectedUnitId?: string;
  section: Section;
}) {
  const router = useRouter();
  const { units, unit, loading, error, retry } = useUnits(selectedUnitId);
  const settingsHref = unit ? `/settings?unitId=${encodeURIComponent(unit.id)}` : "/settings";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {section === "today" && <p className="mb-2 text-sm font-medium text-emerald-700">Dashboard</p>}
          <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
            {section === "today" ? `Olá, ${operatorName}!` : titles[section]}
          </h1>
        </div>
        {unit && <UnitSelector units={units} unit={unit} onChange={(id) =>
          router.replace(operationUrl(id, section), { scroll: false })} />}
      </header>
      {loading || error ? (
        <UnitLoadState loading={loading} error={error} retry={retry} />
      ) : unit ? (
        <>
          <nav aria-label="Ações da operação" className="flex flex-wrap gap-2">
            {section !== "today" && <Link className="botao gap-2" href={operationUrl(unit.id)}>
              <Clock3 aria-hidden="true" size={16} /> Voltar ao Dashboard
            </Link>}
            {section !== "entry" && <Link className="botao botao-primario gap-2" href={operationUrl(unit.id, "entry")}>
              <ArrowDownToLine aria-hidden="true" size={16} /> Registrar reserva
            </Link>}
            {section !== "yard" && <Link className="botao gap-2" href={operationUrl(unit.id, "yard")}>
              <ParkingSquare aria-hidden="true" size={16} /> Ver pátio
            </Link>}
            <Link className="botao gap-2" href={`/history?unitId=${encodeURIComponent(unit.id)}`}>
              <History aria-hidden="true" size={16} /> Consultar histórico
            </Link>
          </nav>
          {section === "today" && <DashboardMetrics key={unit.id} unitId={unit.id} />}
          {section === "entry" && <EntryForm key={unit.id} unit={unit} onOpenSettings={() => router.push(settingsHref)} />}
          {section === "yard" && <Yard key={unit.id} unit={unit} />}
        </>
      ) : (
        <section className="painel space-y-4">
          <p>Cadastre uma unidade para começar a operar o estacionamento.</p>
          <Link className="botao botao-primario" href={settingsHref}>Cadastrar unidade</Link>
        </section>
      )}
    </main>
  );
}
