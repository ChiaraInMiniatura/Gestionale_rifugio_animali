// Bottone di eliminazione animale, usato solo nel dettaglio ADMIN (vedi
// [id]/page.tsx, che lo mostra solo se isAdmin). Il controllo ruolo vero
// e proprio resta comunque nella rotta API DELETE: questo componente non
// è un livello di sicurezza, solo l'interfaccia per chi può già vederlo.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EliminaAnimaleButton({
  animaleId,
  nome,
  haEventiClinici,
  haAdozioni,
}: {
  animaleId: number;
  nome: string;
  // Calcolati dal server component chiamante (animale.eventiClinici.length
  // > 0 / animale.adozioni.length > 0): evita query aggiuntive qui solo
  // per saperlo. Entrambe le relazioni sono onDelete: Cascade, quindi
  // eliminare l'animale elimina silenziosamente anche la sua cartella
  // clinica e il suo storico affidi/adozioni: chi conferma deve saperlo
  // prima di procedere, non scoprirlo dopo.
  haEventiClinici: boolean;
  haAdozioni: boolean;
}) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleElimina() {
    // Conferma esplicita: azione distruttiva e irreversibile, pensata
    // per utenti finali non tecnici (anche anziani) che non devono poter
    // eliminare un animale con un click accidentale. Testo diverso se ci
    // sono dati collegati che andrebbero persi insieme (cartella clinica
    // e/o storico affidi/adozioni).
    let testoConferma = `Eliminare definitivamente ${nome}? L'operazione non è annullabile.`;
    if (haEventiClinici && haAdozioni) {
      testoConferma =
        "Questo animale ha anche una cartella clinica e uno storico affidi/adozioni: eliminandolo, tutti questi dati verranno eliminati definitivamente. Sei davvero sicura/o di voler procedere?";
    } else if (haEventiClinici) {
      testoConferma =
        "Questo animale ha anche una cartella clinica: eliminandolo, tutti i dati clinici collegati (vaccini, terapie, visite) verranno eliminati definitivamente. Sei davvero sicura/o di voler procedere?";
    } else if (haAdozioni) {
      testoConferma =
        "Questo animale ha anche uno storico affidi/adozioni: eliminandolo, tutti questi dati verranno eliminati definitivamente. Sei davvero sicura/o di voler procedere?";
    }
    const confermato = window.confirm(testoConferma);
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
        className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 transition hover:scale-105 hover:bg-red-50 active:scale-95 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:active:bg-red-900"
      >
        Elimina animale
      </button>
      {errore && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errore}</p>}
    </div>
  );
}
