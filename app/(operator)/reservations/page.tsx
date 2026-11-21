import { Reservations } from "@/app/_components/operations/reservations";

type ReservationsPageProps = { searchParams: Promise<{ unitId?: string | string[] }> };

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const { unitId } = await searchParams;
  return <Reservations selectedUnitId={typeof unitId === "string" ? unitId : undefined} />;
}
