"use client";

import { Building2, CircleDollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../empty-state";
import { formatPrice, formatTimestamp } from "./api";
import { UnitLoadState, useUnits } from "./units";

export function UnitSettingsPage({ selectedUnitId }: { selectedUnitId?: string }) {
  const { unit, loading, error, retry } = useUnits(selectedUnitId);
  const newUnitHref = unit ? `/settings/units/new?unitId=${encodeURIComponent(unit.id)}` : "/settings/units/new";
  const rateHref = unit ? `/settings/rates/new?unitId=${encodeURIComponent(unit.id)}` : "/settings/rates/new";

  if (loading || error) return <UnitLoadState loading={loading} error={error} retry={retry} />;

  return (
    <div className="space-y-6">
      <section className="painel space-y-4" aria-labelledby="unit-settings-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id="unit-settings-heading" className="text-xl font-semibold">Unidades</h2>
            <p className="text-sm text-slate-600">Gerencie a unidade selecionada e cadastre novos locais.</p>
          </div>
          {unit && <Link className="botao gap-2" href={newUnitHref}><Plus size={16} aria-hidden="true" /> Cadastrar unidade</Link>}
        </div>
        {unit ? (
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">{unit.name}</p>
            <p className="mt-1 text-sm text-slate-600">Fuso horário: {unit.timeZone}</p>
          </div>
        ) : (
          <EmptyState compact icon={<Building2 />} title="Nenhuma unidade cadastrada"
            description="Cadastre uma unidade para começar a operar o estacionamento.">
            <Link className="botao botao-primario" href="/settings/units/new">Cadastrar unidade</Link>
          </EmptyState>
        )}
      </section>
      {unit && (
        <section className="painel space-y-4" aria-labelledby="rate-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 id="rate-heading" className="break-words text-xl font-semibold">Tarifa de {unit.name}</h2>
              <p className="text-sm text-slate-600">A tarifa vigente é aplicada às novas reservas.</p>
            </div>
            {unit.activeRate && <Link className="botao gap-2" href={rateHref}><Plus size={16} aria-hidden="true" /> Nova tarifa</Link>}
          </div>
          {unit.activeRate ? (
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-semibold">{formatPrice(unit.activeRate.priceCents)}
                {unit.activeRate.mode === "blocks" ? ` por bloco de ${unit.activeRate.blockMinutes} min` : " por hora"}</p>
              <p className="mt-1 text-sm text-slate-600">Vigente desde {formatTimestamp(unit.activeRate.effectiveAt, unit.timeZone)}.</p>
            </div>
          ) : (
            <EmptyState compact icon={<CircleDollarSign />} title="Nenhuma tarifa cadastrada"
              description="Cadastre uma tarifa para liberar as reservas nesta unidade.">
              <Link className="botao botao-primario" href={rateHref}>Cadastrar tarifa</Link>
            </EmptyState>
          )}
        </section>
      )}
    </div>
  );
}
