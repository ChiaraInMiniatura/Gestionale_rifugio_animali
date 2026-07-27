// Calcolo dello stato di scadenza per la cartella clinica (src/app/animali/[id]
// e src/app/animali/scadenze) e della lista "Farmaci di oggi" in dashboard.
// Le due funzioni coprono le due semantiche mutuamente esclusive di
// EventoClinico (vedi RicorrenzaEvento in schema.prisma): eventi puntuali
// con dataScadenza vs terapie giornaliere con dataFine.

/** Esito di calcolaStatoScadenza: colore da applicare in UI, o "nessuno
 *  stato" quando la scadenza non esiste o è troppo lontana. */
export type StatoScadenza = "scaduto" | "in_scadenza" | null;

// Giorno di calendario (UTC, senza orario) di una Date: usato per
// confrontare due date "a livello di giorno", ignorando l'ora. Estratto in
// un helper perché sia calcolaStatoScadenza sia terapiaAttivaOggi ne hanno
// bisogno, sugli stessi campi (data/dataScadenza/dataFine) che per
// ricorrenza=GIORNALIERA rappresentano giorni, non istanti precisi (vedi
// commento su EventoClinico in schema.prisma: "l'orario è ignorato in UI").
function giornoUTC(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Determina lo stato di scadenza di un evento non ricorrente (vaccino,
 * antiparassitario, visita) a partire dalla sua dataScadenza.
 * @param dataScadenza prossimo richiamo/visita, o null se non prevista
 *   (in quel caso non c'è nulla da segnalare).
 * @param oggi data di riferimento; di default `new Date()`, ma
 *   parametrizzabile per rendere la funzione testabile senza dipendere
 *   dall'orologio di sistema.
 * @returns "scaduto" se dataScadenza è nel passato rispetto a oggi (rosso),
 *   "in_scadenza" se rientra nei prossimi 14 giorni, oggi incluso
 *   (arancione), altrimenti null (nessuna segnalazione).
 */
export function calcolaStatoScadenza(
  dataScadenza: Date | null,
  oggi: Date = new Date()
): StatoScadenza {
  if (!dataScadenza) {
    return null;
  }

  // Confronto a livello di giorno (non di orario esatto): coerente con la
  // soglia "entro 14 giorni", pensata in termini di giornate di calendario,
  // non di ore residue.
  const giorniMancanti = Math.floor(
    (giornoUTC(dataScadenza) - giornoUTC(oggi)) / 86400000
  );

  if (giorniMancanti < 0) {
    return "scaduto";
  }
  if (giorniMancanti <= 14) {
    return "in_scadenza";
  }
  return null;
}

/** Sottoinsieme di campi di EventoClinico richiesto da calcolaStatoEvento e
 *  dataRilevanteEvento: vale solo per ricorrenza=NESSUNA (vaccino,
 *  antiparassitario, visita). */
export interface EventoNonRicorrente {
  data: Date;
  dataScadenza: Date | null;
  confermato: boolean;
}

/** Data di un evento non ricorrente rilevante ai fini di una scadenza,
 *  insieme al campo da cui proviene — serve a chi mostra l'evento per
 *  colorare/etichettare la riga giusta (data vs dataScadenza), non
 *  sempre la stessa. */
export interface DataRilevante {
  data: Date;
  campo: "data" | "dataScadenza";
}

/**
 * Determina quale data di un evento non ricorrente è rilevante ai fini di
 * una scadenza, senza applicare alcuna soglia temporale (nessun concetto
 * di "vicino" o "lontano" qui): usata sia da calcolaStatoEvento sotto sia
 * dalla vista aggregata /animali/scadenze, che deve mostrare anche le
 * date lontane nel tempo (sezione "Scadenze future").
 * @param evento evento con dataScadenza e il flag confermato: un
 *   appuntamento non confermato è esso stesso il promemoria (nessuno ha
 *   ancora verificato che sia avvenuto), uno confermato usa invece
 *   l'eventuale richiamo successivo.
 * @returns { data, campo }: campo "data" se l'evento non è confermato
 *   (l'appuntamento stesso, in attesa di conferma); campo "dataScadenza"
 *   se confermato e con un richiamo impostato; null se confermato e senza
 *   richiamo (nulla da segnalare).
 */
export function dataRilevanteEvento(evento: EventoNonRicorrente): DataRilevante | null {
  if (!evento.confermato) {
    return { data: evento.data, campo: "data" };
  }
  if (!evento.dataScadenza) {
    return null;
  }
  return { data: evento.dataScadenza, campo: "dataScadenza" };
}

/** Esito di calcolaStatoEvento: oltre allo stato (colore), indica quale
 *  campo ha determinato quella data (vedi dataRilevanteEvento). campo è
 *  null solo quando stato è null per assenza di una data candidata
 *  (evento confermato senza dataScadenza impostata). */
export interface StatoEvento {
  stato: StatoScadenza;
  campo: "data" | "dataScadenza" | null;
}

/**
 * Determina lo stato di scadenza di un evento non ricorrente, tenendo
 * conto anche di appuntamenti futuri non ancora confermati come avvenuti
 * (non solo del classico "richiamo" in dataScadenza): sceglie la data
 * rilevante con dataRilevanteEvento, poi applica la soglia dei 14 giorni
 * di calcolaStatoScadenza sopra, senza duplicare la logica di scelta.
 * @param evento evento con data, dataScadenza e confermato.
 * @param oggi data di riferimento; di default `new Date()`.
 * @returns { stato, campo }, vedi dataRilevanteEvento per il significato
 *   di campo; stato è null se non c'è una data candidata oppure se quella
 *   scelta è troppo lontana nel tempo (oltre 14 giorni).
 */
export function calcolaStatoEvento(
  evento: EventoNonRicorrente,
  oggi: Date = new Date()
): StatoEvento {
  const rilevante = dataRilevanteEvento(evento);
  if (!rilevante) {
    return { stato: null, campo: null };
  }
  return { stato: calcolaStatoScadenza(rilevante.data, oggi), campo: rilevante.campo };
}

/**
 * Classi Tailwind per il colore (ed eventuale peso) del testo di una
 * scadenza: unica fonte di verità, usata sia nel dettaglio animale sia
 * nella vista aggregata /animali/scadenze, così restano coerenti ovunque.
 * "Scaduto" è anche in grassetto, non solo rosso: per un pubblico anziano
 * il colore da solo (soprattutto rosso vs arancione) può non bastare a
 * distinguere i due stati, il grassetto è un secondo segnale ridondante
 * che non dipende dalla percezione del colore.
 * @param stato esito di calcolaStatoScadenza o calcolaStatoEvento.
 * @returns classi Tailwind (light + dark) da applicare al testo.
 */
export function coloreScadenza(stato: StatoScadenza): string {
  if (stato === "scaduto") return "font-bold text-red-600 dark:text-red-400";
  if (stato === "in_scadenza") return "text-orange-600 dark:text-orange-400";
  return "text-zinc-700 dark:text-zinc-300";
}

/** Sottoinsieme di campi di EventoClinico richiesto da terapiaAttivaOggi:
 *  accetta sia record Prisma completi sia oggetti minimi (utile nei test). */
export interface TerapiaGiornaliera {
  data: Date;
  dataFine: Date | null;
}

/**
 * Verifica se una terapia giornaliera è attiva nel giorno indicato.
 * @param evento terapia con data di inizio e (eventuale) dataFine; per gli
 *   eventi non ricorrenti questa funzione non va usata (dataFine è sempre
 *   null in quel caso, vedi RicorrenzaEvento).
 * @param oggi data di riferimento; di default `new Date()`.
 * @returns true se evento.data è iniziata (oggi o prima) e non è ancora
 *   terminata (dataFine null, "ancora in corso", oppure oggi o dopo).
 *   Confronto a livello di giorno di calendario, non di orario: una
 *   terapia iniziata "oggi" risulta attiva per l'intera giornata, a
 *   prescindere dall'ora corrente.
 */
export function terapiaAttivaOggi(
  evento: TerapiaGiornaliera,
  oggi: Date = new Date()
): boolean {
  const oggiUTC = giornoUTC(oggi);
  return (
    giornoUTC(evento.data) <= oggiUTC &&
    (evento.dataFine === null || giornoUTC(evento.dataFine) >= oggiUTC)
  );
}
