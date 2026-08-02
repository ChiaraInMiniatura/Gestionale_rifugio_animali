// Bottone per confermare/annullare la conferma di un evento clinico non
// giornaliero (evento singolo, o richiamo mensile/annuale): un
// appuntamento futuro nasce non confermato, e resta segnalato
// (arancione/rosso, vedi calcolaStatoEvento) finché qualcuno non conferma
// che è avvenuto. Per i richiami mensili/annuali, confermare genera anche
// il prossimo evento della serie (vedi src/lib/genera-prossimo-evento.ts).
// A differenza di EliminaEventoButton, l'azione è reversibile e non
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
              "rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:scale-105 hover:bg-page active:scale-95 active:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            : "rounded-full border border-positive/40 px-3 py-1.5 text-sm font-medium text-positive transition hover:scale-105 hover:bg-positive-soft active:scale-95 active:bg-positive-soft disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {confermato ? "Annulla conferma" : "Segna come confermato"}
      </button>
      {errore && <p className="mt-1 text-xs text-danger">{errore}</p>}
    </div>
  );
}
