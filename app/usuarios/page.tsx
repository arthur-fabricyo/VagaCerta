import Link from "next/link";
import { exigirOperador } from "../../lib/acesso";
import { listarUsuarios } from "../../lib/usuarios";
import { Sair } from "../_components/sair";
import { ListaUsuarios } from "./lista-usuarios";

export default async function Usuarios() {
  await exigirOperador();
  const usuarios = await listarUsuarios();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="link" href="/">VagaCerta</Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Usuários</h1>
        </div>
        <Sair />
      </header>
      <ListaUsuarios {...usuarios} />
    </main>
  );
}
