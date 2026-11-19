"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { authClient } from "../../lib/auth-client";

export function FormularioAcesso({ cadastro = false }: { cadastro?: boolean }) {
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    setEnviando(true);
    setErro("");

    try {
      const resultado = cadastro
        ? await authClient.signUp.email({ name: String(formData.get("name")).trim(), email, password })
        : await authClient.signIn.email({ email, password });

      if (!resultado.error) {
        window.location.replace("/");
        return;
      }

      if (resultado.error.status === 429) {
        setErro("Muitas tentativas. Aguarde um pouco e tente novamente.");
      } else if (resultado.error.status >= 500) {
        setErro("O serviço está temporariamente indisponível. Tente novamente.");
      } else {
        setErro(cadastro ? "Não foi possível criar a conta com esses dados." : "Confira o e-mail e a senha.");
      }
    } catch {
      setErro("Verifique a conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-6 py-10">
      <section className="painel w-full">
        <p className="marca">VagaCerta</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{cadastro ? "Criar conta" : "Entrar"}</h1>
        {cadastro && (
          <p className="mt-2 text-sm text-slate-300">Um operador precisa aprovar seu cadastro para liberar o acesso.</p>
        )}
        <form className="mt-6 flex flex-col gap-4" method="post" onSubmit={enviar}>
          {cadastro && (
            <label className="campo">
              Nome
              <input autoComplete="name" name="name" maxLength={120} pattern=".*\S.*" required />
            </label>
          )}
          <label className="campo">
            E-mail
            <input autoComplete="email" type="email" name="email" maxLength={254} required />
          </label>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              autoComplete={cadastro ? "new-password" : "current-password"}
              type="password"
              name="password"
              id="senha"
              minLength={cadastro ? 8 : undefined}
              maxLength={128}
              aria-describedby={cadastro ? "requisito-senha" : undefined}
              required
            />
            {cadastro && <span id="requisito-senha" className="text-sm font-normal text-slate-300">Use pelo menos 8 caracteres.</span>}
          </div>
          {erro && <p role="alert" className="text-sm text-rose-300">{erro}</p>}
          <button className="botao botao-primario" disabled={enviando} type="submit">
            {enviando ? "Enviando…" : cadastro ? "Criar conta" : "Entrar"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-300">
          {cadastro ? "Já tem conta? " : "Primeiro acesso? "}
          <Link className="link" href={cadastro ? "/entrar" : "/cadastro"}>
            {cadastro ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </section>
    </main>
  );
}
