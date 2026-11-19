import { z } from "zod";
import { negarAcessoApi } from "../../../../lib/acesso";
import { getAuthOrigin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";

const decisaoSchema = z.strictObject({ acao: z.enum(["aprovar", "recusar"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const negado = await negarAcessoApi(request.headers);
  if (negado) return negado;
  if (request.headers.get("origin") !== getAuthOrigin()) {
    return Response.json({ erro: "Origem da solicitação não autorizada." }, { status: 403 });
  }

  const decisao = decisaoSchema.safeParse(await request.json().catch(() => null));
  if (!decisao.success) {
    return Response.json({ erro: "Escolha aprovar ou recusar o cadastro." }, { status: 400 });
  }

  const { id } = await params;
  const where = { id, aprovado: false };
  const users = getDb().user;
  const { count } = decisao.data.acao === "aprovar"
    ? await users.updateMany({ where, data: { aprovado: true } })
    : await users.deleteMany({ where });

  if (count === 0) {
    return Response.json({ erro: "Este cadastro já foi analisado ou não existe." }, { status: 409 });
  }

  return Response.json({ ok: true });
}
