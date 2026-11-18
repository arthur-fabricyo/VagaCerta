import { negarAcessoApi } from "../../../lib/acesso";
import { listarUsuarios } from "../../../lib/usuarios";

export async function GET(request: Request) {
  const negado = await negarAcessoApi(request.headers);
  if (negado) return negado;
  return Response.json(await listarUsuarios(), { headers: { "Cache-Control": "no-store" } });
}
