import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

export async function consultarAcesso(requestHeaders: Headers) {
  const session = await getAuth().api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true, disableRefresh: true },
  });

  if (!session) return { estado: "anonimo" } as const;
  if (!session.user.aprovado) return { estado: "pendente" } as const;
  return { estado: "aprovado", usuario: session.user } as const;
}

export async function exigirOperador() {
  const acesso = await consultarAcesso(await headers());
  if (acesso.estado === "anonimo") redirect("/entrar");
  if (acesso.estado === "pendente") redirect("/aguardando-aprovacao");
  return acesso.usuario;
}

export async function negarAcessoApi(requestHeaders: Headers) {
  const acesso = await consultarAcesso(requestHeaders);
  if (acesso.estado === "aprovado") return null;
  if (acesso.estado === "anonimo") {
    return Response.json({ erro: "Entre para continuar." }, { status: 401 });
  }
  return Response.json({ erro: "Cadastro aguardando aprovação." }, { status: 403 });
}
