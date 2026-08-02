// Form condiviso da creazione e modifica di un evento clinico: la sola
// presenza di eventoIniziale decide la modalità (POST vs PATCH,
// precompilazione dei campi), stesso principio già usato in AnimaleForm.
// Il toggle ricorrenza mostra dataScadenza (solo NESSUNA), dataFine (solo
// GIORNALIERA), o un testo informativo senza campi (MENSILE/ANNUALE, il
// richiamo successivo si genera da solo — vedi
// src/lib/genera-prossimo-evento.ts): mai più di un campo insieme,
// riflette in UI il vincolo di mutua esclusione applicato lato Zod
// (src/lib/validations/evento-clinico.ts). L'invio è sempre preceduto da
// un popup di conferma esplicito, testo diverso per creazione e modifica.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { z } from "zod";
import { eventoClinicoSchema } from "@/lib/validations/evento-clinico";
import { TIPO_EVENTO_LABEL, RICORRENZA_LABEL } from "@/lib/evento-clinico-label";
import { TipoEvento, RicorrenzaEvento } from "@/generated/prisma/enums";
import type { TipoEvento as TTipoEvento, RicorrenzaEvento as TRicorrenzaEvento } from "@/generated/prisma/enums";

const TIPI = Object.values(TipoEvento);
const RICORRENZE = Object.values(RicorrenzaEvento);

// z.input (non z.infer/output) perché "ricorrenza" ha un .default() nello
// schema: il tipo di output lo rende obbligatorio, ma prima del parse (i
// valori grezzi del form, prima che zodResolver li validi) va trattato
// come opzionale. defaultValues sotto lo valorizza comunque sempre.
type EventoClinicoFormValues = z.input<typeof eventoClinicoSchema>;

type EventoIniziale = {
  id: number;
  tipo: TTipoEvento;
  nomeSpecifico: string;
  data: Date;
  dataScadenza: Date | null;
  ricorrenza: TRicorrenzaEvento;
  dataFine: Date | null;
  note: string | null;
};

// L'input HTML type="datetime-local" richiede "YYYY-MM-DDTHH:mm" in ora
// locale (non UTC): a differenza di toDateInputValue in animale-form.tsx,
// qui non si può usare toISOString() perché convertirebbe in UTC e
// mostrerebbe un orario diverso da quello effettivamente salvato.
function toDatetimeLocalValue(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Testo del popup di conferma in creazione: diverso per tipo di evento,
// come richiesto dalla specifica (MOD8), non un unico messaggio generico.
function testoConfermaCreazione(data: EventoClinicoFormValues, nomeAnimale: string): string {
  if (data.ricorrenza === "GIORNALIERA") {
    const dataInizio = format(new Date(data.data), "d MMMM yyyy", { locale: it });
    return `Confermi di aver avviato la terapia "${data.nomeSpecifico}" per ${nomeAnimale} a partire dal ${dataInizio}?`;
  }

  const dataFormattata = format(new Date(data.data), "d MMMM yyyy 'alle' HH:mm", { locale: it });
  if (data.tipo === "VISITA") {
    return `Confermi la visita "${data.nomeSpecifico}" per ${nomeAnimale} in data ${dataFormattata}?`;
  }

  // Un vaccino/antiparassitario con data futura non è ancora stato
  // somministrato, solo programmato: "aver somministrato" implicherebbe
  // un'azione già avvenuta, grammaticalmente sbagliata per un appuntamento
  // non ancora passato.
  if (new Date(data.data) > new Date()) {
    return `Confermi di aver programmato ${data.nomeSpecifico} per ${nomeAnimale} il ${dataFormattata}?`;
  }
  return `Confermi di aver somministrato ${data.nomeSpecifico} a ${nomeAnimale} in data ${dataFormattata}?`;
}

// Testo del popup di conferma in modifica: stessa distinzione futura/passata
// di testoConfermaCreazione sopra, perché modificare un appuntamento non
// ancora avvenuto è concettualmente diverso dal correggere il log di
// qualcosa già accaduto. VISITA e GIORNALIERA restano testi neutri rispetto
// al tempo (non pongono lo stesso problema grammaticale).
function testoConfermaModifica(data: EventoClinicoFormValues, nomeAnimale: string): string {
  if (data.ricorrenza === "GIORNALIERA") {
    return `Confermi le modifiche alla terapia "${data.nomeSpecifico}" per ${nomeAnimale}?`;
  }

  const dataFormattata = format(new Date(data.data), "d MMMM yyyy 'alle' HH:mm", { locale: it });
  if (data.tipo === "VISITA") {
    return `Confermi le modifiche alla visita "${data.nomeSpecifico}" per ${nomeAnimale} in data ${dataFormattata}?`;
  }

  if (new Date(data.data) > new Date()) {
    return `Confermi le modifiche alla programmazione di ${data.nomeSpecifico} per ${nomeAnimale} il ${dataFormattata}?`;
  }
  return `Confermi le modifiche alla somministrazione di ${data.nomeSpecifico} per ${nomeAnimale} in data ${dataFormattata}?`;
}

export function EventoClinicoForm({
  animaleId,
  nomeAnimale,
  eventoIniziale,
}: {
  animaleId: number;
  nomeAnimale: string;
  eventoIniziale?: EventoIniziale;
}) {
  const router = useRouter();
  const [erroreServer, setErroreServer] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventoClinicoFormValues>({
    // Stesso schema Zod della rotta API: eventuali errori mostrati qui
    // sono gli stessi che il server applicherebbe comunque.
    resolver: zodResolver(eventoClinicoSchema),
    defaultValues: eventoIniziale
      ? {
          tipo: eventoIniziale.tipo,
          nomeSpecifico: eventoIniziale.nomeSpecifico,
          data: toDatetimeLocalValue(eventoIniziale.data),
          ricorrenza: eventoIniziale.ricorrenza,
          dataScadenza: toDatetimeLocalValue(eventoIniziale.dataScadenza) || undefined,
          dataFine: toDatetimeLocalValue(eventoIniziale.dataFine) || undefined,
          note: eventoIniziale.note ?? "",
        }
      : { tipo: "VACCINO", ricorrenza: "NESSUNA" },
  });

  // Determina cosa mostrare sotto la data (dataScadenza, dataFine, o il
  // testo informativo per Mensile/Annuale): mai più di un campo insieme
  // in UI, riflette il vincolo lato Zod.
  const ricorrenza = watch("ricorrenza");
  const { onChange: onRicorrenzaChangeRHF, ...restRicorrenza } = register("ricorrenza");

  /**
   * Invia i dati del form dopo conferma esplicita dell'utente: POST per un
   * nuovo evento, PATCH per uno esistente, in base alla presenza di
   * eventoIniziale. Nessuna scrittura se il popup di conferma è annullato.
   * @param data dati già validati da Zod (via zodResolver).
   */
  async function onSubmit(data: EventoClinicoFormValues) {
    const testoConferma = eventoIniziale
      ? testoConfermaModifica(data, nomeAnimale)
      : testoConfermaCreazione(data, nomeAnimale);
    const confermato = window.confirm(testoConferma);
    if (!confermato) return;

    setErroreServer(null);

    const url = eventoIniziale
      ? `/api/animali/${animaleId}/eventi/${eventoIniziale.id}`
      : `/api/animali/${animaleId}/eventi`;
    const method = eventoIniziale ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErroreServer(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }

      router.push(`/animali/${animaleId}`);
      router.refresh();
    } catch {
      setErroreServer("Impossibile contattare il server. Controlla la connessione e riprova.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-sm"
    >
      <h1 className="mb-6 text-xl font-semibold text-ink">
        {eventoIniziale ? "Modifica evento clinico" : "Nuovo evento clinico"}
      </h1>

      <div className="mb-4">
        <label htmlFor="tipo" className="mb-1 block text-sm font-medium text-ink-soft">
          Tipo
        </label>
        <select
          id="tipo"
          {...register("tipo")}
          className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
        >
          {TIPI.map((t) => (
            <option key={t} value={t}>
              {TIPO_EVENTO_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="nomeSpecifico" className="mb-1 block text-sm font-medium text-ink-soft">
          Nome specifico
        </label>
        <input
          id="nomeSpecifico"
          type="text"
          placeholder='Es. "Trivalente", "Advantix", "Controllo annuale"'
          {...register("nomeSpecifico")}
          className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
        />
        {errors.nomeSpecifico && (
          <p className="mt-1 text-sm text-danger">{errors.nomeSpecifico.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="ricorrenza" className="mb-1 block text-sm font-medium text-ink-soft">
          Frequenza
        </label>
        <select
          id="ricorrenza"
          {...restRicorrenza}
          onChange={(e) => {
            onRicorrenzaChangeRHF(e);
            // Svuota i campi non pertinenti alla scelta corrente: evita
            // che un valore residuo di un'altra modalità venga inviato
            // insieme (rifiutato lato Zod con il vincolo di mutua
            // esclusione, ma è più chiaro pulirlo subito anche in UI).
            // Solo NESSUNA usa dataScadenza; solo GIORNALIERA usa dataFine.
            if (e.target.value !== "NESSUNA") {
              setValue("dataScadenza", undefined);
            }
            if (e.target.value !== "GIORNALIERA") {
              setValue("dataFine", undefined);
            }
          }}
          className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
        >
          {RICORRENZE.map((r) => (
            <option key={r} value={r}>
              {RICORRENZA_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="data" className="mb-1 block text-sm font-medium text-ink-soft">
          {ricorrenza === "GIORNALIERA" ? "Data di inizio" : "Data (con orario)"}
        </label>
        <input
          id="data"
          type="datetime-local"
          {...register("data")}
          className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
        />
        {errors.data && (
          <p className="mt-1 text-sm text-danger">{errors.data.message}</p>
        )}
      </div>

      {ricorrenza === "GIORNALIERA" ? (
        <div className="mb-6">
          <label htmlFor="dataFine" className="mb-1 block text-sm font-medium text-ink-soft">
            Data di fine (lascia vuoto se ancora in corso)
          </label>
          <input
            id="dataFine"
            type="datetime-local"
            {...register("dataFine")}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
          />
          {errors.dataFine && (
            <p className="mt-1 text-sm text-danger">{errors.dataFine.message}</p>
          )}
        </div>
      ) : ricorrenza === "MENSILE" || ricorrenza === "ANNUALE" ? (
        // Nessun campo da compilare: il richiamo successivo lo genera da
        // solo il sistema, alla conferma di questo (vedi
        // src/lib/genera-prossimo-evento.ts) — non ha senso chiedere qui
        // una data che l'app calcola automaticamente.
        <p className="mb-6 text-sm text-ink-soft">
          Il prossimo richiamo verrà generato automaticamente alla conferma.
        </p>
      ) : (
        <div className="mb-6">
          <label htmlFor="dataScadenza" className="mb-1 block text-sm font-medium text-ink-soft">
            Prossimo richiamo (facoltativo)
          </label>
          <input
            id="dataScadenza"
            type="datetime-local"
            {...register("dataScadenza")}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
          />
          {errors.dataScadenza && (
            <p className="mt-1 text-sm text-danger">{errors.dataScadenza.message}</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="note" className="mb-1 block text-sm font-medium text-ink-soft">
          Note {`(es. veterinario, luogo)`}
        </label>
        <textarea
          id="note"
          rows={3}
          {...register("note")}
          className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
        />
      </div>

      {erroreServer && (
        <p className="mb-4 text-sm text-danger">{erroreServer}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-accent px-5 py-2.5 font-medium text-white transition hover:scale-[1.02] hover:bg-accent-hover active:scale-95 active:bg-accent-active disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Salvataggio in corso..." : "Salva"}
      </button>
    </form>
  );
}
