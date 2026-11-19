"use client";

import { ArrowDownToLine, ArrowUpFromLine, CarFront } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardSummary } from "@/lib/dashboard/dashboard-contract";
import { messageFor, request } from "./api";

const chartConfig = {
  entries: { label: "Reservas", color: "var(--color-emerald-700)" },
  exits: { label: "Saídas", color: "var(--color-sky-600)" },
} satisfies ChartConfig;

const cards = [
  { key: "vehiclesOnSite", label: "No pátio agora", icon: CarFront, color: "text-slate-600" },
  { key: "entriesToday", label: "Reservas hoje", icon: ArrowDownToLine, color: "text-emerald-700" },
  { key: "exitsToday", label: "Saídas hoje", icon: ArrowUpFromLine, color: "text-sky-700" },
] as const;

const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}h`;
const formatCount = new Intl.NumberFormat("pt-BR").format;

export function DashboardMetrics({ unitId }: { unitId: string }) {
  const [data, setData] = useState<DashboardSummary>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    request<DashboardSummary>(`/api/dashboard?unitId=${encodeURIComponent(unitId)}`, { signal: controller.signal })
      .then((summary) => {
        if (!controller.signal.aborted) setData(summary);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(messageFor(failure));
      });
    return () => controller.abort();
  }, [unitId, attempt]);

  if (error) return (
    <div className="painel space-y-3">
      <p role="alert" className="text-rose-700">Não foi possível carregar os indicadores. {error}</p>
      <button className="botao" type="button" onClick={() => {
        setError("");
        setAttempt((previous) => previous + 1);
      }}>Tentar novamente</button>
    </div>
  );
  if (!data) return <p className="painel" role="status">Carregando indicadores…</p>;

  const hourly = data.hourly.map((item) => ({ ...item, hourLabel: formatHour(item.hour) }));

  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <dt className="flex items-center justify-between gap-2 text-sm font-medium text-slate-600">
              {label} <Icon aria-hidden="true" className={color} size={20} />
            </dt>
            <dd className="mt-2 text-3xl font-semibold tabular-nums">{formatCount(data[key])}</dd>
          </div>
        ))}
      </dl>
      <section className="painel min-w-0" aria-labelledby="movement-heading">
        <header className="mb-5">
          <h2 id="movement-heading" className="text-xl font-semibold">Movimento de hoje</h2>
          <p className="mt-1 text-sm text-slate-600">{data.localDate.split("-").reverse().join("/")}</p>
        </header>
        {data.entriesToday === 0 && data.exitsToday === 0 && (
          <p className="mb-3 text-sm text-slate-600">Nenhuma reserva ou saída registrada hoje.</p>
        )}
        <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full sm:h-72">
          <BarChart accessibilityLayer data={hourly} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis allowDecimals={false} width="auto" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="entries" name="Reservas" fill="var(--color-entries)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="exits" name="Saídas" fill="var(--color-exits)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </section>
    </>
  );
}
