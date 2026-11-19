import { OperationsDashboard } from "@/app/_components/operations/dashboard";
import { exigirOperador } from "@/lib/acesso";

type HomeProps = { searchParams: Promise<{ unitId?: string | string[]; section?: string | string[] }> };

export default async function HomePage({ searchParams }: HomeProps) {
  const [operator, { unitId, section }] = await Promise.all([exigirOperador(), searchParams]);

  return (
    <OperationsDashboard
      operatorName={operator.name}
      selectedUnitId={typeof unitId === "string" ? unitId : undefined}
      section={section === "entry" || section === "yard" ? section : "today"}
    />
  );
}
