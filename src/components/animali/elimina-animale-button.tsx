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
}: {
  animaleId: number;
  nome: string;
  // Calcolato dal server component chiamante (animale.eventiClinici.length
  // > 0): evita una query aggiuntiva qui solo per saperlo. La FK
  // EventoClinico → Animale è onDelete: Cascade, quindi eliminare
  // l'animale elimina silenziosamente anche la sua cartella clinica: chi
  // conferma deve saperlo prima di procedere, non scoprirlo dopo.
  haEventiClinici: boolean;
}) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleElimina() {
    // Conferma esplicita: azione distruttiva e irreversibile, pensata
    // per utenti finali non tecnici (anche anziani) che non devono poter
    // eliminare un animale con un click accidentale. Testo diverso se
    // ci sono eventi clinici collegati, che andrebbero persi insieme.
    const testoConferma = haEventiClinici
      ? "Questo animale ha anche una cartella clinica: eliminandolo, tutti i dati clinici collegati (vaccini, terapie, visite) verranno eliminati definitivamente. Sei davvero sicura di voler procedere?"
      : `Eliminare definitivamente ${nome}? L'operazione non è annullabile.`;
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
        className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        Elimina animale
      </button>
      {errore && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errore}</p>}
    </div>
  );
}
