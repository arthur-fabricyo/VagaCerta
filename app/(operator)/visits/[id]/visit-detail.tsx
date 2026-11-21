"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/app/_components/empty-state";
import { formatDuration, formatPrice, formatTimestamp, messageFor, request, send, type Visit }
  from "@/app/_components/operations/api";

type Action = "exit" | "cancel";

const visitStatus = { open: "Em aberto", closed: "Encerrada", cancelled: "Cancelada" };

export function VisitDetail({ id }: { id: string }) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const path = `/api/visits/${encodeURIComponent(id)}`;

  useEffect(() => {
    const controller = new AbortController();
    request<{ visit: Visit }>(path, { signal: controller.signal })
      .then((result) => setVisit(result.visit))
      .catch((failure) => {
        if (!controller.signal.aborted) setError(messageFor(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, loadAttempt]);

  function reload() {
    setError("");
    setLoading(true);
    setPendingAction(null);
    setLoadAttempt((previous) => previous + 1);
  }

  async function updateVisit(action: Action) {
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await send<{ visit: Visit }>(path, "PATCH", { action });
      setVisit(result.visit);
      setPendingAction(null);
      setSuccess(action === "exit" ? "Saída registrada." : "Visita cancelada.");
    } catch (failure) {
      setError(messageFor(failure));
    } finally {
      setSaving(false);
    }
  }

  const backUrl = visit ? `/?unitId=${encodeURIComponent(visit.unit.id)}&section=yard` : "/";
  return (
    <div className="space-y-6" aria-busy={loading || saving}>
      <p><Link className="link" href={backUrl}>Voltar ao pátio</Link></p>
      {loading && <p role="status">Carregando visita…</p>}
      {error && (
        <div className="painel space-y-3">
          <p role="alert" className="text-rose-700">{error}</p>
          <button className="botao" type="button" disabled={loading || saving} onClick={reload}>Recarregar visita</button>
        </div>
      )}
      <p role="status" className="text-emerald-800 empty:hidden">{success}</p>
      {visit && (
        <>
          <section className="painel space-y-4" aria-labelledby="visit-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="visit-heading" className="text-2xl font-semibold">{visit.plate}</h2>
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium">{visitStatus[visit.status]}</p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-600">Unidade</dt>
                <dd>{visit.unit.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Reserva</dt>
                <dd>{formatTimestamp(visit.enteredAt, visit.unit.timeZone)} · {visit.entryOperator.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Tarifa fixada na reserva</dt>
                <dd>
                  {formatPrice(visit.rate.priceCents)}
                  {visit.rate.mode === "blocks" ? ` por bloco de ${visit.rate.blockMinutes} min` : " por hora"}
                </dd>
                <dd className="text-sm text-slate-600">
                  {visit.rate.graceMinutes === 0
                    ? "Sem tolerância"
                    : `Tolerância de ${visit.rate.graceMinutes} min. Acima do limite, ${visit.rate.graceMode === "deduct"
                      ? "desconta a tolerância"
                      : "cobra o tempo total"}.`}
                </dd>
              </div>
              {visit.exitedAt && (
                <div>
                  <dt className="text-sm text-slate-600">Saída</dt>
                  <dd>
                    {formatTimestamp(visit.exitedAt, visit.unit.timeZone)}
                    {visit.exitOperator && ` · ${visit.exitOperator.name}`}
                  </dd>
                </div>
              )}
              {visit.note && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-slate-600">Observação</dt>
                  <dd className="whitespace-pre-wrap break-words">{visit.note}</dd>
                </div>
              )}
            </dl>
            {visit.hasPhoto
              ? <Image src={`${path}/photo`} alt={`Foto de reserva de ${visit.plate}`}
                width={360} height={240} className="h-auto max-h-60 w-auto max-w-full rounded-lg object-contain" unoptimized />
              : <EmptyState compact icon={<ImageOff />} title="Sem foto" description="Nenhuma foto foi anexada a esta reserva." />}
          </section>
          {visit.status === "closed" && visit.totalCents !== null && (
            <section className="painel space-y-3" aria-labelledby="charge-heading">
              <h2 id="charge-heading" className="text-xl font-semibold">Cobrança</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-600">Duração real</dt>
                  <dd>{formatDuration(visit.durationSeconds ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Tempo cobrável</dt>
                  <dd>{formatDuration(visit.billableSeconds ?? 0)}</dd>
                </div>
                {visit.blocks !== null && (
                  <div>
                    <dt className="text-sm text-slate-600">Blocos cobrados</dt>
                    <dd>{visit.blocks}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-slate-600">Total (quitação simulada)</dt>
                  <dd className="text-xl font-semibold text-emerald-800">{formatPrice(visit.totalCents)}</dd>
                </div>
              </dl>
            </section>
          )}
          {visit.status === "open" && (
            <section className="painel space-y-4" aria-labelledby="actions-heading">
              <h2 id="actions-heading" className="text-xl font-semibold">Ações da visita</h2>
              {!pendingAction ? (
                <div className="flex flex-wrap gap-3">
                  <button className="botao botao-primario" type="button" disabled={loading}
                    onClick={() => setPendingAction("exit")}>Registrar saída</button>
                  <button className="botao" type="button" disabled={loading}
                    onClick={() => setPendingAction("cancel")}>Cancelar visita</button>
                </div>
              ) : (
                <>
                  <p>
                    {pendingAction === "exit"
                      ? "A saída encerra a visita e registra a cobrança da permanência."
                      : "O cancelamento encerra esta visita sem cobrança."}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button className="botao botao-primario" type="button" autoFocus disabled={saving || loading}
                      onClick={() => updateVisit(pendingAction)}>
                      {saving ? "Salvando…" : pendingAction === "exit" ? "Confirmar saída" : "Confirmar cancelamento"}
                    </button>
                    <button className="botao" type="button" disabled={saving}
                      onClick={() => setPendingAction(null)}>Voltar</button>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
