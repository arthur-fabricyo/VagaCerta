import Link from "next/link";
import { UnitSettingsPage } from "@/app/_components/operations/unit-settings-page";

export default async function SettingsPage({ searchParams }: {
  searchParams: Promise<{ unitId?: string | string[] }>;
}) {
  const { unitId } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <Link className="botao" href="/usuarios">Usuários</Link>
      </header>
      <UnitSettingsPage selectedUnitId={typeof unitId === "string" ? unitId : undefined} />
    </main>
  );
}
