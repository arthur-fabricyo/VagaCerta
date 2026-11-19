"use client";

import { useState } from "react";
import { authClient } from "../../lib/auth-client";

export function useSignOut() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (!result.error) {
        window.location.replace("/entrar");
        return;
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return { signOut, pending, error };
}

export function Sair() {
  const { signOut, pending, error } = useSignOut();

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" className="botao" disabled={pending} onClick={signOut}>
        {pending ? "Saindo…" : "Sair"}
      </button>
      {error && <p role="alert" className="text-sm text-rose-300">Não foi possível sair. Tente novamente.</p>}
    </div>
  );
}
