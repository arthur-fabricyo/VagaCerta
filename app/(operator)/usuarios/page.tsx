import { exigirOperador } from "@/lib/acesso";
import { listarUsuarios } from "@/lib/usuarios";
import { ListaUsuarios } from "./lista-usuarios";

export default async function Usuarios() {
  await exigirOperador();
  const usuarios = await listarUsuarios();

  return (
    <main className="operator-page">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="operator-page-title">Usuários</h1>
        </div>
      </header>
      <ListaUsuarios {...usuarios} />
    </main>
  );
}
