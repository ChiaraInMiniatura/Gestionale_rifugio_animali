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
