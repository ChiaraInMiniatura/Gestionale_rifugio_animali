// Bottone di eliminazione di un singolo evento clinico, usato nella lista
// "Cartella clinica" del dettaglio animale (vedi [id]/page.tsx). A
// differenza di EliminaAnimaleButton, non è ADMIN-only: chiunque loggato
// e approvato può eliminare un evento, coerente con il fatto che può
// anche crearlo/modificarlo (vedi rotta DELETE in eventi/[eventoId]/route.ts).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { TIPO_EVENTO_LABEL } from "@/lib/evento-clinico-label";
import type { TipoEvento } from "@/generated/prisma/enums";

export function EliminaEventoButton({
  animaleId,
  eventoId,
  tipo,
  nomeSpecifico,
  data,
}: {
  animaleId: number;
  eventoId: number;
  // Servono solo per il testo del popup di conferma (identificare quale
  // voce si sta eliminando): non per la chiamata DELETE, che usa solo gli id.
  tipo: TipoEvento;
  nomeSpecifico: string;
  data: Date;
}) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleElimina() {
    // Testo specifico (tipo, nomeSpecifico, data) invece del generico
    // "questa voce": più chiaro per chi ha molte voci in cartella clinica
    // e deve capire a colpo d'occhio quale sta per eliminare.
    const dataFormattata = format(data, "d MMMM yyyy, HH:mm", { locale: it });
    const confermato = window.confirm(
      `Sei sicura di voler eliminare ${TIPO_EVENTO_LABEL[tipo]}: ${nomeSpecifico} del ${dataFormattata}? L'azione è irreversibile.`
    );
    if (!confermato) return;

    setErrore(null);
    setEliminando(true);

    try {
      const res = await fetch(`/api/animali/${animaleId}/eventi/${eventoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrore(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }

      // Resta sulla pagina di dettaglio: solo refresh per far sparire la
      // voce eliminata dalla lista, a differenza di EliminaAnimaleButton
      // che invece reindirizza (lì l'intera pagina non ha più senso).
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
        className="rounded-full border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:scale-105 hover:bg-red-50 active:scale-95 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:active:bg-red-900"
      >
        Elimina
      </button>
      {errore && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errore}</p>}
    </div>
  );
}
