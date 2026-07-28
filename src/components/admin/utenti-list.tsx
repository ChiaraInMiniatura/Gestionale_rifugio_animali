// Elenco completo degli utenti (VOLONTARIA e ADMIN), diviso in "in attesa
// di approvazione" e "confermati", usato dalla pagina /admin. Le liste
// non vengono duplicate in useState: si rendono direttamente dalle props,
// e ogni azione chiama router.refresh() per far ripartire la query lato
// server (AdminPage) — così un'approvazione o un cambio ruolo che sposta
// un utente tra sezioni/etichette arriva già corretto al prossimo render,
// senza dover gestire a mano lo spostamento tra array client-side.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Ruolo = "VOLONTARIA" | "ADMIN";

type Utente = {
  id: number;
  name: string;
  email: string;
  role: Ruolo;
  createdAt: string;
  cellulare: string;
  note: string;
};

const RUOLO_LABEL: Record<Ruolo, string> = {
  VOLONTARIA: "Volontaria/o",
  ADMIN: "Admin",
};

export function UtentiList({
  inAttesa,
  confermati,
  idUtenteCorrente,
}: {
  inAttesa: Utente[];
  confermati: Utente[];
  idUtenteCorrente: number;
}) {
  return (
    <div className="w-full max-w-2xl space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          In attesa di approvazione
        </h2>
        {inAttesa.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nessuna richiesta in attesa.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {inAttesa.map((u) => (
              <UtenteRow
                key={u.id}
                utente={u}
                stato="attesa"
                isSe={u.id === idUtenteCorrente}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Utenti confermati
        </h2>
        {confermati.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nessun utente confermato.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {confermati.map((u) => (
              <UtenteRow
                key={u.id}
                utente={u}
                stato="confermata"
                isSe={u.id === idUtenteCorrente}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * Singola riga: dati anagrafici, ruolo, azioni principali (diverse a
 * seconda di "stato" e di "isSe" — sulla propria riga niente Elimina né
 * Cambia ruolo, per evitare un blocco accidentale) e le due sezioni
 * collassabili Note/Cambia password, ad uso esclusivo dell'ADMIN — mai
 * visibili né in altro modo raggiungibili dall'utente stesso.
 */
function UtenteRow({
  utente,
  stato,
  isSe,
}: {
  utente: Utente;
  stato: "attesa" | "confermata";
  isSe: boolean;
}) {
  const router = useRouter();
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [noteAperte, setNoteAperte] = useState(false);
  const [passwordAperta, setPasswordAperta] = useState(false);

  async function handleApprova() {
    setErrore(null);
    setCaricamento(true);
    try {
      const res = await fetch(`/api/admin/users/${utente.id}/approve`, {
        method: "PATCH",
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
      setCaricamento(false);
    }
  }

  function handleRifiuta() {
    const confermato = window.confirm(
      `Rifiutare definitivamente la richiesta di ${utente.email}? L'operazione elimina l'account e non è annullabile.`
    );
    if (confermato) {
      eliminaAccount("reject");
    }
  }

  function handleElimina() {
    const confermato = window.confirm(
      `Eliminare definitivamente l'account di ${utente.email}? L'operazione non è annullabile.`
    );
    if (confermato) {
      eliminaAccount("elimina");
    }
  }

  async function eliminaAccount(azione: "reject" | "elimina") {
    setErrore(null);
    setCaricamento(true);
    try {
      const res = await fetch(`/api/admin/users/${utente.id}/${azione}`, {
        method: "DELETE",
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
      setCaricamento(false);
    }
  }

  function handleCambiaRuolo() {
    const nuovoRuolo: Ruolo = utente.role === "ADMIN" ? "VOLONTARIA" : "ADMIN";
    const testoConferma =
      nuovoRuolo === "ADMIN"
        ? `Rendere ${utente.name} amministratore? Avrà accesso completo alla gestione di utenti e adozioni.`
        : `Togliere i permessi di amministratore a ${utente.name}? Tornerà a essere volontaria/o.`;
    const confermato = window.confirm(testoConferma);
    if (!confermato) return;

    setErrore(null);
    setCaricamento(true);
    fetch(`/api/admin/users/${utente.id}/ruolo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nuovoRuolo }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setErrore(body?.message ?? "Si è verificato un errore. Riprova.");
          return;
        }
        router.refresh();
      })
      .catch(() => {
        setErrore("Impossibile contattare il server. Controlla la connessione e riprova.");
      })
      .finally(() => setCaricamento(false));
  }

  return (
    <li className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium capitalize text-zinc-900 dark:text-zinc-50">
            {utente.name}{" "}
            <span className="text-xs font-normal text-zinc-600 dark:text-zinc-400">
              ({RUOLO_LABEL[utente.role]})
            </span>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{utente.email}</p>
          <p className="text-xs text-zinc-700 dark:text-zinc-300">
            Registrata/o il {format(new Date(utente.createdAt), "d MMMM yyyy", { locale: it })}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {stato === "attesa" ? (
            <>
              <button
                type="button"
                disabled={caricamento}
                onClick={handleApprova}
                className="rounded-full bg-teal-700 px-4 py-1.5 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700"
              >
                Approva
              </button>
              <button
                type="button"
                disabled={caricamento}
                onClick={handleRifiuta}
                className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 transition hover:scale-105 hover:bg-red-50 active:scale-95 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:active:bg-red-900"
              >
                Rifiuta
              </button>
            </>
          ) : (
            !isSe && (
              <button
                type="button"
                disabled={caricamento}
                onClick={handleElimina}
                className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 transition hover:scale-105 hover:bg-red-50 active:scale-95 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:active:bg-red-900"
              >
                Elimina
              </button>
            )
          )}
        </div>
      </div>

      {errore && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errore}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {!isSe && (
          <button
            type="button"
            disabled={caricamento}
            onClick={handleCambiaRuolo}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
          >
            {utente.role === "ADMIN" ? "Rendi volontaria/o" : "Rendi admin"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setNoteAperte((v) => !v)}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
        >
          {noteAperte ? "Chiudi note" : "Note"}
        </button>
        <button
          type="button"
          onClick={() => setPasswordAperta((v) => !v)}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
        >
          {passwordAperta ? "Annulla" : "Cambia password"}
        </button>
      </div>

      {noteAperte && (
        <NoteForm
          userId={utente.id}
          cellulareIniziale={utente.cellulare}
          noteIniziali={utente.note}
          onSalvato={() => setNoteAperte(false)}
        />
      )}

      {passwordAperta && (
        <CambiaPasswordForm
          userId={utente.id}
          email={utente.email}
          onSalvato={() => setPasswordAperta(false)}
        />
      )}
    </li>
  );
}

/**
 * Form collassabile per cellulare/note: dato ad uso esclusivo dell'ADMIN,
 * salvataggio solo tramite bottone dedicato (nessun autosave al digitare).
 */
function NoteForm({
  userId,
  cellulareIniziale,
  noteIniziali,
  onSalvato,
}: {
  userId: number;
  cellulareIniziale: string;
  noteIniziali: string;
  onSalvato: () => void;
}) {
  const router = useRouter();
  const [cellulare, setCellulare] = useState(cellulareIniziale);
  const [note, setNote] = useState(noteIniziali);
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleSalva() {
    setErrore(null);
    setSalvataggio(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cellulare, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrore(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }
      router.refresh();
      onSalvato();
    } catch {
      setErrore("Impossibile contattare il server. Controlla la connessione e riprova.");
    } finally {
      setSalvataggio(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="mb-2">
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cellulare
        </label>
        <input
          type="text"
          value={cellulare}
          onChange={(e) => setCellulare(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Note (es. disponibilità, difficoltà)
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      {errore && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{errore}</p>}
      <button
        type="button"
        disabled={salvataggio}
        onClick={handleSalva}
        className="rounded-full bg-teal-700 px-4 py-1.5 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700"
      >
        {salvataggio ? "Salvataggio..." : "Salva"}
      </button>
    </div>
  );
}

/**
 * Form collassabile per il cambio password fatto dall'ADMIN: nessun campo
 * precompilato, nessuna richiesta della password attuale (nemmeno sulla
 * propria riga), conferma esplicita prima di sovrascrivere.
 */
function CambiaPasswordForm({
  userId,
  email,
  onSalvato,
}: {
  userId: number;
  email: string;
  onSalvato: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleSalva() {
    setErrore(null);

    // Stessa soglia minima usata in registrazione, controllata qui prima
    // di chiamare il server per un riscontro immediato.
    if (password.length < 8) {
      setErrore("La password deve avere almeno 8 caratteri");
      return;
    }

    const confermato = window.confirm(
      `Impostare una nuova password per ${email}? La password attuale smetterà di funzionare immediatamente.`
    );
    if (!confermato) return;

    setSalvataggio(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrore(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }
      router.refresh();
      onSalvato();
    } catch {
      setErrore("Impossibile contattare il server. Controlla la connessione e riprova.");
    } finally {
      setSalvataggio(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Nuova password
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Almeno 8 caratteri"
        className="mb-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {errore && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{errore}</p>}
      <button
        type="button"
        disabled={salvataggio}
        onClick={handleSalva}
        className="rounded-full bg-teal-700 px-4 py-1.5 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700"
      >
        {salvataggio ? "Salvataggio..." : "Salva"}
      </button>
    </div>
  );
}
