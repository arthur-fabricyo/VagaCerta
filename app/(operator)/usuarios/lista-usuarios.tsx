"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { UsuarioResumo } from "@/lib/usuarios";

type Acao = "aprovar" | "recusar";

export function ListaUsuarios({ pendentes, aprovados }: { pendentes: UsuarioResumo[]; aprovados: UsuarioResumo[] }) {
  const router = useRouter();
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [alterando, iniciarAlteracao] = useTransition();

  function decidir(usuario: UsuarioResumo, acao: Acao) {
    setMensagem("");
    setErro("");
    iniciarAlteracao(async () => {
      try {
        const resposta = await fetch(`/api/usuarios/${encodeURIComponent(usuario.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao }),
        });

        if (resposta.status === 401 || resposta.status === 403) {
          router.refresh();
          return;
        }
        if (resposta.status === 409) {
          setErro("Este cadastro já foi analisado ou não existe.");
          router.refresh();
          return;
        }
        if (!resposta.ok) throw new Error();

        setMensagem(acao === "aprovar" ? "Cadastro aprovado." : "Cadastro recusado.");
        router.refresh();
      } catch {
        setErro("Não foi possível atualizar o cadastro. Tente novamente.");
      }
    });
  }

  return (
    <div className="mt-7 space-y-5" aria-busy={alterando}>
      {erro && <p role="alert" className="text-sm text-rose-700">{erro}</p>}
      <p role="status" className="text-sm text-emerald-800 empty:hidden">{mensagem}</p>
      <section className="painel" aria-labelledby="pendentes">
        <h2 id="pendentes" className="text-xl font-semibold">Cadastros pendentes</h2>
        {pendentes.length === 0 ? (
          <p className="mt-3 text-slate-600">Nenhum cadastro aguardando aprovação.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">Recusar remove o cadastro pendente.</p>
            <ul className="mt-3 divide-y divide-slate-200">
              {pendentes.map((usuario) => (
                <li key={usuario.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 break-words">
                    <p className="font-medium">{usuario.name}</p>
                    <p className="text-sm text-slate-600">{usuario.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="botao botao-primario" type="button" disabled={alterando}
                      aria-label={`Aprovar ${usuario.name}`} onClick={() => decidir(usuario, "aprovar")}>Aprovar</button>
                    <button className="botao" type="button" disabled={alterando}
                      aria-label={`Recusar ${usuario.name}`} onClick={() => decidir(usuario, "recusar")}>Recusar</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className="painel" aria-labelledby="aprovados">
        <h2 id="aprovados" className="text-xl font-semibold">Operadores aprovados</h2>
        <ul className="mt-3 divide-y divide-slate-200">
          {aprovados.map((usuario) => (
            <li key={usuario.id} className="break-words py-3">
              <p className="font-medium">{usuario.name}</p>
              <p className="text-sm text-slate-600">{usuario.email}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
