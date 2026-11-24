import { SettingsRegistration } from "@/app/_components/operations/settings-registration";

export default async function NewRatePage({ searchParams }: {
  searchParams: Promise<{ unitId?: string | string[] }>;
}) {
  const { unitId } = await searchParams;
  return <SettingsRegistration mode="rate" selectedUnitId={typeof unitId === "string" ? unitId : undefined} />;
}
