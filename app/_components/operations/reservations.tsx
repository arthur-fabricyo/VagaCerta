"use client";

import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "../empty-state";
import type { Unit } from "./api";
import { EntryForm } from "./entry-form";
import { UnitLoadState, useUnits } from "./units";
import { Yard } from "./yard";

function UnitReservations({ unit }: { unit: Unit }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const reservationForm = useRef<HTMLDivElement>(null);
  const focusRequested = useRef(false);

  useEffect(() => {
    if (adding && focusRequested.current) {
      focusRequested.current = false;
      reservationForm.current?.focus();
    }
  }, [adding]);

  function openReservation() {
    if (adding) {
      reservationForm.current?.focus();
    } else {
      focusRequested.current = true;
      setAdding(true);
    }
  }

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="operator-page-title">Reservas</h1>
          <p className="text-slate-600">Consulte as reservas em aberto e escolha a ordem de exibição.</p>
        </div>
        <button type="button" className="botao botao-primario gap-2"
          aria-expanded={adding} aria-controls="new-reservation" onClick={() => setAdding(!adding)}>
          <Plus aria-hidden="true" size={18} /> {adding ? "Fechar cadastro" : "Adicionar reserva"}
        </button>
      </header>
      {adding && (
        <div id="new-reservation" ref={reservationForm} tabIndex={-1}>
          <EntryForm unit={unit} showEmptyState onOpenSettings={() => router.push(`/settings/rates/new?unitId=${encodeURIComponent(unit.id)}`)}
            onRegistered={() => setRefreshVersion((previous) => previous + 1)} />
        </div>
      )}
      <Yard unit={unit} title="Reservas em aberto" initialOrder="oldest" refreshVersion={refreshVersion}
        onAddReservation={openReservation} />
    </>
  );
}

export function Reservations({ selectedUnitId }: { selectedUnitId?: string }) {
  const { unit, loading, error, retry } = useUnits(selectedUnitId);

  return (
    <main className="operator-page">
      {!loading && !error && unit ? (
        <UnitReservations key={unit.id} unit={unit} />
      ) : (
        <>
          <header><h1 className="operator-page-title">Reservas</h1></header>
          {loading || error ? (
            <UnitLoadState loading={loading} error={error} retry={retry} />
          ) : (
            <EmptyState icon={<Building2 />} title="Comece pela sua primeira unidade"
              description="Cadastre uma unidade para organizar e acompanhar suas reservas.">
              <Link className="botao botao-primario" href="/settings/units/new">Cadastrar unidade</Link>
            </EmptyState>
          )}
        </>
      )}
    </main>
  );
}
