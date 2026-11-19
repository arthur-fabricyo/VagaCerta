import Link from "next/link";
import { exigirOperador } from "../lib/acesso";
import { Sair } from "./_components/sair";
import { OperationsDashboard } from "./_components/operations/dashboard";

type HomeProps = { searchParams: Promise<{ unitId?: string | string[]; section?: string | string[] }> };

export default async function HomePage({ searchParams }: HomeProps) {
  const operator = await exigirOperador();
  const { unitId, section } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-10 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">VagaCerta</h1>
          <p className="mt-2 break-words text-slate-300">Olá, {operator.name}.</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Conta">
          <Link className="botao" href="/usuarios">Usuários</Link>
          <Sair />
        </nav>
      </header>
      <OperationsDashboard
        initialUnitId={typeof unitId === "string" ? unitId : undefined}
        initialSection={section === "yard" ? "yard" : undefined}
      />
    </main>
  );
}
