// Controllo ADMIN-only per il cambio stato di un animale, mostrato nel
// dettaglio (vedi [id]/page.tsx). La selezione nello <select> è separata
// dal salvataggio effettivo: cambiare la select non chiama subito l'API,
// serve un click esplicito su "Salva", per evitare che uno stato critico
// (es. "Adottato") venga impostato per errore con un solo cambio di menu.
//
// Quando la selezione è IN_AFFIDO o ADOTTATO, compaiono i campi della
// persona (nome/cognome/cellulare/documento/nota): precompilati se esiste
// già un rapporto Adozione aperto per l'animale (es. un affido che
// diventa adozione, dati invariati salvo correzioni), vuoti altrimenti —
// in quel caso obbligatori, la rotta API rifiuta un nuovo affido/adozione
// senza questi dati (vedi [id]/route.ts).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatoAnimale } from "@/generated/prisma/enums";
import { STATO_LABEL } from "@/lib/stato-animale";

const STATI = Object.values(StatoAnimale);

type AdozioneAperta = {
  nome: string;
  cognome: string;
  cellulare: string;
  documento: string;
  note: string;
};

export function StatoControl({
  animaleId,
  statoAttuale,
  adozioneAperta,
}: {
  animaleId: number;
  statoAttuale: StatoAnimale;
  adozioneAperta: AdozioneAperta | null;
}) {
  const router = useRouter();
  // "stato" è la selezione corrente nel form, non ancora salvata:
  // statoAttuale resta il valore confermato sul server, usato per capire
  // se c'è una modifica pendente (vedi disabled del bottone Salva sotto).
  const [stato, setStato] = useState(statoAttuale);
  const [nome, setNome] = useState(adozioneAperta?.nome ?? "");
  const [cognome, setCognome] = useState(adozioneAperta?.cognome ?? "");
  const [cellulare, setCellulare] = useState(adozioneAperta?.cellulare ?? "");
  const [documento, setDocumento] = useState(adozioneAperta?.documento ?? "");
  const [note, setNote] = useState(adozioneAperta?.note ?? "");
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const richiedeDatiPersona = stato === "IN_AFFIDO" || stato === "ADOTTATO";
  // I dati sono obbligatori solo se si sta aprendo un rapporto nuovo
  // (nessun rapporto già aperto): se ce n'è già uno, restano modificabili
  // ma facoltativi (la rotta API li lascia invariati se non inviati).
  const datiObbligatori = richiedeDatiPersona && !adozioneAperta;
  // Vero anche senza cambiare lo stato: serve per correggere un dato
  // sbagliato (o aggiornare un recapito) sul rapporto già aperto, senza
  // dover passare per un cambio di stato che non c'entra. Nota: questo
  // sovrascrive i dati sullo stesso record — per un vero cambio di
  // persona (affidatario diverso), meglio chiudere il rapporto e
  // riaprirne uno nuovo, così lo storico resta accurato.
  const personaModificata =
    richiedeDatiPersona &&
    adozioneAperta !== null &&
    (nome !== adozioneAperta.nome ||
      cognome !== adozioneAperta.cognome ||
      cellulare !== adozioneAperta.cellulare ||
      documento !== adozioneAperta.documento ||
      note !== adozioneAperta.note);
  const cisonoModifiche = stato !== statoAttuale || personaModificata;

  async function handleSalva() {
    setErrore(null);
    setSalvataggio(true);

    try {
      const res = await fetch(`/api/animali/${animaleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Solo "stato" (+ dati persona quando pertinenti) nel body: i
        // campi persona sono prefissati "persona*" per non collidere con
        // "nome"/"note" di CAMPI_BASE (vedi validations/animale.ts).
        body: JSON.stringify(
          richiedeDatiPersona
            ? {
                stato,
                personaNome: nome,
                personaCognome: cognome,
                personaCellulare: cellulare,
                personaDocumento: documento,
                personaNote: note,
              }
            : { stato }
        ),
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
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={stato}
          disabled={salvataggio}
          onChange={(e) => setStato(e.target.value as StatoAnimale)}
          className="rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink"
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
          // Disabilitato se non c'è nulla da salvare (né lo stato né i
          // dati della persona sono cambiati): evita chiamate API inutili
          // e comunica visivamente che non ci sono modifiche pendenti.
          disabled={salvataggio || !cisonoModifiche}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:scale-105 hover:bg-accent-hover active:scale-95 active:bg-accent-active disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvataggio ? "Salvataggio..." : "Salva"}
        </button>
      </div>

      {richiedeDatiPersona && (
        <div className="mt-3 space-y-2 rounded-xl border border-line p-3">
          <p className="text-xs text-ink-soft">
            {adozioneAperta
              ? "Dati della persona (già salvati, correggi solo se serve)"
              : "Dati della persona (obbligatori per affidare/adottare)"}
          </p>
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required={datiObbligatori}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink"
          />
          <input
            type="text"
            placeholder="Cognome"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
            required={datiObbligatori}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink"
          />
          <input
            type="text"
            placeholder="Cellulare"
            value={cellulare}
            onChange={(e) => setCellulare(e.target.value)}
            required={datiObbligatori}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink"
          />
          <input
            type="text"
            placeholder="Documento (es. CI AB1234567)"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            required={datiObbligatori}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink"
          />
          <textarea
            placeholder="Note (facoltative)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink"
          />
        </div>
      )}

      {errore && <p className="mt-2 text-sm text-danger">{errore}</p>}
    </div>
  );
}
