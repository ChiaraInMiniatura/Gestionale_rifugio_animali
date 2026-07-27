// Bottone per confermare/annullare la conferma di un evento clinico non
// ricorrente (vaccino, antiparassitario, visita): un appuntamento futuro
// nasce non confermato, e resta segnalato (arancione/rosso, vedi
// calcolaStatoEvento) finché qualcuno non conferma che è avvenuto. A
// differenza di EliminaEventoButton, l'azione è reversibile e non
// distruttiva: nessun popup di conferma, PATCH diretto.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfermaEventoButton({
  animaleId,
  eventoId,
  confermato,
}: {
  animaleId: number;
  eventoId: number;
  confermato: boolean;
}) {
  const router = useRouter();
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleClick() {
    setErrore(null);
    setSalvataggio(true);

    try {
      const res = await fetch(`/api/animali/${animaleId}/eventi/${eventoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Solo "confermato" nel body: la rotta API rifiuta la richiesta
        // se mischiato ad altri campi (vedi [eventoId]/route.ts).
        body: JSON.stringify({ confermato: !confermato }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrore(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }

      router.refresh();
    } catch {
      setErrore("Impossibile contattare il server. Controlla la connessione e riprova.");
    } finally {
      setSalvataggio(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={salvataggio}
        onClick={handleClick}
        className={
          confermato
            ? // Azione secondaria/discreta: non deve confondersi con
              // un'azione distruttiva come l'eliminazione (niente rosso).
              "rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
            : "rounded-full border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:scale-105 hover:bg-emerald-50 active:scale-95 active:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:active:bg-emerald-900"
        }
      >
        {confermato ? "Annulla conferma" : "Segna come confermato"}
      </button>
      {errore && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errore}</p>}
    </div>
  );
}
