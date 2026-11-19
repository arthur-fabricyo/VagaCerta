import Link from "next/link";
import { exigirOperador } from "../lib/acesso";
import { Sair } from "./_components/sair";

export default async function PaginaInicial() {
  const usuario = await exigirOperador();
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">VagaCerta</h1>
        <Sair />
      </header>
      <p className="mt-5 break-words text-slate-300">Olá, {usuario.name}.</p>
      <nav className="mt-6" aria-label="Operação">
        <Link className="botao botao-primario" href="/usuarios">Usuários</Link>
      </nav>
    </main>
  );
}
