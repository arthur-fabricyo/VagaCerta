"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useUnits } from "@/app/_components/operations/units";

export function OperationSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUnitId = searchParams.get("unitId") ?? undefined;
  const { units, unit, loading, error, retry } = useUnits(selectedUnitId);

  function selectUnit(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("unitId", id);
    const destination = pathname.startsWith("/visits/") ? "/reservations" : pathname;
    router.replace(`${destination}?${params}`, { scroll: false });
  }

  useEffect(() => {
    if (unit && !selectedUnitId && ["/", "/reservations", "/settings", "/history"].includes(pathname)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("unitId", unit.id);
      router.replace(`${pathname}?${params}`, { scroll: false });
    }
  }, [unit, selectedUnitId, pathname, router, searchParams]);

  if (loading) return <span className="text-sm text-slate-500" role="status">Carregando unidades…</span>;
  if (error) return <button type="button" className="text-sm text-rose-700 underline" onClick={retry}>Tentar carregar unidades</button>;
  if (!unit) return <Link href="/settings/units/new" className="text-sm font-medium text-emerald-700">Cadastrar unidade</Link>;

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700">
      <span className="sr-only sm:not-sr-only">Unidade em operação</span>
      <select aria-label="Unidade em operação" value={unit.id} onChange={(event) => selectUnit(event.target.value)}
        className="h-9 w-40 max-w-full rounded-md border border-slate-300 bg-white px-2 text-sm sm:w-52">
        {units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  );
}
