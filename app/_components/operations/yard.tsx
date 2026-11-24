"use client";

import { CalendarDays, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { sortReservations, type ReservationOrder } from "../../../lib/reservations/order";
import { PlateInput } from "../plate-input";
import { EmptyState } from "../empty-state";
import { placaSchema } from "../../../lib/placa";
import { formatDuration, formatTimestamp, messageFor, request, type Unit, type Visit } from "./api";

export function Yard({ unit, title = "Pátio", initialOrder = "newest", refreshVersion = 0, onAddReservation }: {
  unit: Unit;
  title?: string;
  initialOrder?: ReservationOrder;
  refreshVersion?: number;
  onAddReservation?: () => void;
}) {
  const [order, setOrder] = useState<ReservationOrder>(initialOrder);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [plate, setPlate] = useState("");
  const [search, setSearch] = useState({ plate: "", times: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const parameters = new URLSearchParams({ unitId: unit.id });
    if (search.plate) parameters.set("plate", search.plate);
    request<{ visits: Visit[] }>(`/api/visits?${parameters}`, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setVisits(result.visits);
        setNow(Date.now());
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(messageFor(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [unit.id, search, refreshVersion]);

  function loadVisits(nextPlate: string) {
    setError("");
    setLoading(true);
    setSearch({ plate: nextPlate, times: search.times + 1 });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchError("");
    if (!plate.trim()) {
      loadVisits("");
      return;
    }
    const parsed = placaSchema.safeParse(plate);
    if (!parsed.success) {
      setSearchError("Informe uma placa brasileira completa ou deixe a busca vazia.");
      return;
    }
    loadVisits(parsed.data);
  }

  return (
    <section className="painel space-y-4" aria-labelledby="yard-heading">
      <h2 id="yard-heading" className="text-xl font-semibold">{title}</h2>
      <form autoComplete="off" className="flex flex-wrap items-end gap-3" onSubmit={submitSearch}>
        <label className="campo">
          Buscar por placa
          <PlateInput value={plate} onValueChange={setPlate} />
        </label>
        <button className="botao botao-primario" type="submit">Buscar</button>
        {(plate || search.plate) && (
          <button className="botao" type="button" onClick={() => {
            setPlate("");
            setSearchError("");
            loadVisits("");
          }}>Limpar busca</button>
        )}
        <button className="botao" type="button" onClick={() => loadVisits(search.plate)} disabled={loading}>
          Atualizar
        </button>
      </form>
      <label className="campo w-full max-w-xs">
        Ordenar por
        <select value={order} onChange={(event) => setOrder(event.target.value as ReservationOrder)}>
          <option value="oldest">Mais antigas (maior tempo no pátio)</option>
          <option value="newest">Mais recentes</option>
          <option value="plate-asc">Placa (A–Z)</option>
          <option value="plate-desc">Placa (Z–A)</option>
        </select>
      </label>
      {searchError && <p role="alert" className="text-rose-700">{searchError}</p>}
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      {loading && <p role="status" className="text-slate-600">Carregando visitas…</p>}
      {!loading && !error && visits.length === 0 && (
        onAddReservation ? (
          <EmptyState status icon={search.plate ? <SearchX /> : <CalendarDays />}
            title={search.plate ? "Nenhuma reserva encontrada" : "Nenhuma reserva em aberto"}
            description={search.plate
              ? `Não encontramos uma reserva em aberto para ${search.plate} nesta unidade.`
              : "As reservas registradas nesta unidade aparecerão aqui enquanto estiverem em aberto."}>
            {search.plate ? (
              <button className="botao" type="button" onClick={() => {
                setPlate("");
                setSearchError("");
                loadVisits("");
              }}>Limpar busca</button>
            ) : (
              <button className="botao botao-primario" type="button" onClick={onAddReservation}>Adicionar reserva</button>
            )}
          </EmptyState>
        ) : <p role="status" className="text-slate-600">
          {search.plate ? `Nenhuma visita em aberto para ${search.plate}.` : "Nenhuma visita em aberto nesta unidade."}
        </p>
      )}
      {!loading && !error && visits.length > 0 && (
        <ul className="divide-y divide-slate-200">
          {sortReservations(visits, order).map((visit) => (
            <li key={visit.id} className="flex flex-wrap items-center gap-4 py-4">
              {visit.hasPhoto && (
                <Image src={`/api/visits/${visit.id}/photo`} alt={`Foto de reserva de ${visit.plate}`}
                  width={80} height={56} unoptimized className="h-14 w-20 rounded-md object-cover" />
              )}
              <div className="grow space-y-1">
                <p className="font-semibold">{visit.plate}</p>
                <p className="text-sm text-slate-600">
                  Reserva em {formatTimestamp(visit.enteredAt, unit.timeZone)}
                  {" · "}{formatDuration((now - Date.parse(visit.enteredAt)) / 1000)} no pátio
                  {!visit.hasPhoto && " · Sem foto"}
                </p>
              </div>
              <Link className="botao" href={`/visits/${visit.id}`} aria-label={`Ver visita de ${visit.plate}`}>
                Ver visita
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
