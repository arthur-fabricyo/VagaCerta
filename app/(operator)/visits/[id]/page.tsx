import { exigirOperador } from "@/lib/acesso";
import { VisitDetail } from "./visit-detail";

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirOperador();
  const { id } = await params;

  return (
    <main className="operator-page">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="operator-page-title">Detalhe da visita</h1>
        </div>
      </header>
      <VisitDetail id={id} />
    </main>
  );
}
