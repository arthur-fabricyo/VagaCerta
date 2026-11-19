"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { placaSchema } from "../../../lib/placa";
import { formatDuration, formatTimestamp, messageFor, request, type Unit, type Visit } from "./api";

export function Yard({ unit }: { unit: Unit }) {
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
    const controller = new AbortController();
    const parameters = new URLSearchParams({ unitId: unit.id });
    if (search.plate) parameters.set("plate", search.plate);
    request<{ visits: Visit[] }>(`/api/visits?${parameters}`, { signal: controller.signal })
      .then((result) => {
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
  }, [unit.id, search]);

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
      <h2 id="yard-heading" className="text-xl font-semibold">Pátio</h2>
      <form className="flex flex-wrap items-end gap-3" onSubmit={submitSearch}>
        <label className="campo">
          Buscar por placa
          <input value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())}
            autoComplete="off" autoCapitalize="characters" maxLength={16} />
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
      {searchError && <p role="alert" className="text-rose-700">{searchError}</p>}
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      {loading && <p role="status" className="text-slate-600">Carregando visitas…</p>}
      {!loading && !error && visits.length === 0 && (
        <p role="status" className="text-slate-600">
          {search.plate ? `Nenhuma visita em aberto para ${search.plate}.` : "Nenhuma visita em aberto nesta unidade."}
        </p>
      )}
      {!loading && !error && visits.length > 0 && (
        <ul className="divide-y divide-slate-200">
          {visits.map((visit) => (
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
