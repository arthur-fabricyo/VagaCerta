import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consultarAcesso } from "../../lib/acesso";
import { Sair } from "../_components/sair";

export default async function AguardandoAprovacao() {
  const acesso = await consultarAcesso(await headers());
  if (acesso.estado === "anonimo") redirect("/entrar");
  if (acesso.estado === "aprovado") redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center px-6 py-10">
      <section className="painel w-full">
        <p className="marca">VagaCerta</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Cadastro aguardando aprovação</h1>
        <p className="mt-3 text-slate-300">Um operador precisa aprovar sua conta. Confira seu acesso novamente após a aprovação.</p>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          <a className="botao botao-primario" href="/">Conferir acesso</a>
          <Sair />
        </div>
      </section>
    </main>
  );
}
