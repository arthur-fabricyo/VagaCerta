import { UnitSettingsPage } from "@/app/_components/operations/unit-settings-page";

export default async function SettingsPage({ searchParams }: {
  searchParams: Promise<{ unitId?: string | string[] }>;
}) {
  const { unitId } = await searchParams;

  return (
    <main className="operator-page">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="operator-page-title">Configurações</h1>
      </header>
      <UnitSettingsPage selectedUnitId={typeof unitId === "string" ? unitId : undefined} />
    </main>
  );
}
