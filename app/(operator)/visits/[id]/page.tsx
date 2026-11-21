import Link from "next/link";
import { exigirOperador } from "@/lib/acesso";
import { VisitDetail } from "./visit-detail";

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirOperador();
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-10 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="link" href="/">VagaCerta</Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Detalhe da visita</h1>
        </div>
      </header>
      <VisitDetail id={id} />
    </main>
  );
}
