import { getDb } from "./db";

export type UsuarioResumo = { id: string; name: string; email: string };

export async function listarUsuarios() {
  const usuarios = await getDb().user.findMany({
    select: { id: true, name: true, email: true, aprovado: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  const pendentes: UsuarioResumo[] = [];
  const aprovados: UsuarioResumo[] = [];
  for (const { aprovado, ...usuario } of usuarios) {
    (aprovado ? aprovados : pendentes).push(usuario);
  }
  return { pendentes, aprovados };
}
