"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EliminaAnimaleButton({ animaleId, nome }: { animaleId: number; nome: string }) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleElimina() {
    const confermato = window.confirm(
      `Eliminare definitivamente ${nome}? L'operazione non è annullabile.`
    );
    if (!confermato) return;

    setErrore(null);
    setEliminando(true);

    try {
      const res = await fetch(`/api/animali/${animaleId}`, { method: "DELETE" });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrore(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }

      router.push("/animali");
      router.refresh();
    } catch {
      setErrore("Impossibile contattare il server. Controlla la connessione e riprova.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={eliminando}
        onClick={handleElimina}
        className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        Elimina animale
      </button>
      {errore && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errore}</p>}
    </div>
  );
}
