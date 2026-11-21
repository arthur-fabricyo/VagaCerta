import { SettingsRegistration } from "@/app/_components/operations/settings-registration";

export default async function NewUnitPage({ searchParams }: {
  searchParams: Promise<{ unitId?: string | string[] }>;
}) {
  const { unitId } = await searchParams;
  return <SettingsRegistration mode="unit" selectedUnitId={typeof unitId === "string" ? unitId : undefined} />;
}
