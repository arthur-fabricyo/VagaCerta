"use client";

import { useState } from "react";
import { authClient } from "../../lib/auth-client";

export function Sair() {
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState(false);

  async function sair() {
    setSaindo(true);
    setErro(false);
    try {
      const resultado = await authClient.signOut();
      if (!resultado.error) {
        window.location.replace("/entrar");
        return;
      }
      setErro(true);
    } catch {
      setErro(true);
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" className="botao" disabled={saindo} onClick={sair}>
        {saindo ? "Saindo…" : "Sair"}
      </button>
      {erro && <p role="alert" className="text-sm text-rose-300">Não foi possível sair. Tente novamente.</p>}
    </div>
  );
}
