// Controllo ADMIN-only per il cambio stato di un animale, mostrato nel
// dettaglio (vedi [id]/page.tsx). La selezione nello <select> è separata
// dal salvataggio effettivo: cambiare la select non chiama subito l'API,
// serve un click esplicito su "Salva", per evitare che uno stato critico
// (es. "Adottato") venga impostato per errore con un solo cambio di menu.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatoAnimale } from "@/generated/prisma/enums";
import { STATO_LABEL } from "@/lib/stato-animale";

const STATI = Object.values(StatoAnimale);

export function StatoControl({
  animaleId,
  statoAttuale,
}: {
  animaleId: number;
  statoAttuale: StatoAnimale;
}) {
  const router = useRouter();
  // "stato" è la selezione corrente nel form, non ancora salvata:
  // statoAttuale resta il valore confermato sul server, usato per capire
  // se c'è una modifica pendente (vedi disabled del bottone Salva sotto).
  const [stato, setStato] = useState(statoAttuale);
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleSalva() {
    setErrore(null);
    setSalvataggio(true);

    try {
      const res = await fetch(`/api/animali/${animaleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Solo "stato" nel body: la rotta API rifiuta la richiesta se
        // mischiata ad altri campi (vedi CAMPI_BASE in [id]/route.ts).
        body: JSON.stringify({ stato }),
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
      <div className="flex items-center gap-2">
        <select
          value={stato}
          disabled={salvataggio}
          onChange={(e) => setStato(e.target.value as StatoAnimale)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {STATI.map((s) => (
            <option key={s} value={s}>
              {STATO_LABEL[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSalva}
          // Disabilitato se non c'è nulla da salvare (selezione invariata):
          // evita chiamate API inutili e comunica visivamente che non ci
          // sono modifiche pendenti.
          disabled={salvataggio || stato === statoAttuale}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {salvataggio ? "Salvataggio..." : "Salva"}
        </button>
      </div>
      {errore && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errore}</p>}
    </div>
  );
}
