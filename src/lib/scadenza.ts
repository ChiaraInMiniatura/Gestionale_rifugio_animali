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

/** Sottoinsieme di campi di EventoClinico richiesto da calcolaStatoEvento:
 *  vale solo per ricorrenza=NESSUNA (vaccino, antiparassitario, visita). */
export interface EventoNonRicorrente {
  data: Date;
  dataScadenza: Date | null;
  createdAt: Date;
}

/** Esito di calcolaStatoEvento: oltre allo stato (colore), indica quale
 *  campo ha determinato quella data — serve a chi mostra l'evento per
 *  colorare la riga giusta (data vs dataScadenza), non sempre la stessa.
 *  campo è null solo quando stato è null per assenza di una data
 *  candidata (log retrospettivo senza dataScadenza impostata). */
export interface StatoEvento {
  stato: StatoScadenza;
  campo: "data" | "dataScadenza" | null;
}

/**
 * Determina lo stato di scadenza di un evento non ricorrente, tenendo
 * conto anche di appuntamenti futuri non ancora avvenuti (non solo del
 * classico "richiamo" in dataScadenza). Senza questo controllo, un
 * evento con data nel futuro (es. una visita prenotata) non genera mai
 * un promemoria finché non passa la sua data, e a quel punto sparisce
 * silenziosamente invece di segnalare che andrebbe confermato/aggiornato.
 * @param evento evento con data, dataScadenza e createdAt (createdAt
 *   distingue un evento "registrato in anticipo" da un log retrospettivo
 *   di qualcosa già avvenuto).
 * @param oggi data di riferimento; di default `new Date()`.
 * @returns { stato, campo } dove campo indica quale data ha determinato
 *   stato:
 *   - se evento.data è successiva a createdAt (confronto sull'istante
 *     completo, non solo sul giorno: un appuntamento registrato oggi per
 *     più tardi oggi stesso è comunque "programmato in anticipo", non un
 *     log retrospettivo solo perché cade nello stesso giorno di calendario)
 *     — evento "programmato in anticipo": campo "data", stato calcolato
 *     su evento.data;
 *   - altrimenti (log retrospettivo): campo "dataScadenza" (o null se
 *     assente), stato calcolato su dataScadenza — comportamento
 *     invariato rispetto a prima;
 *   - se entrambe le condizioni producono una data candidata (caso raro:
 *     appuntamento futuro con anche un richiamo già impostato), si usa
 *     quella con differenza assoluta in giorni più piccola rispetto a oggi,
 *     e campo riflette quale delle due è stata scelta.
 */
export function calcolaStatoEvento(
  evento: EventoNonRicorrente,
  oggi: Date = new Date()
): StatoEvento {
  // Confronto sull'istante completo (getTime()), non sul giorno di
  // calendario come giornoUTC: la soglia dei 14 giorni resta a livello di
  // giorno (calcolaStatoScadenza), ma qui serve distinguere "prima" da
  // "dopo" anche entro lo stesso giorno, altrimenti un appuntamento
  // registrato oggi per più tardi oggi stesso finirebbe nel ramo
  // retrospettivo e non verrebbe mai segnalato come "in scadenza".
  const programmataInAnticipo = evento.data.getTime() > evento.createdAt.getTime();

  if (!programmataInAnticipo) {
    return {
      stato: calcolaStatoScadenza(evento.dataScadenza, oggi),
      campo: evento.dataScadenza ? "dataScadenza" : null,
    };
  }
  if (!evento.dataScadenza) {
    return { stato: calcolaStatoScadenza(evento.data, oggi), campo: "data" };
  }

  const oggiUTC = giornoUTC(oggi);
  const diffData = Math.abs(giornoUTC(evento.data) - oggiUTC);
  const diffScadenza = Math.abs(giornoUTC(evento.dataScadenza) - oggiUTC);
  const campo: "data" | "dataScadenza" = diffData <= diffScadenza ? "data" : "dataScadenza";
  const dataRilevante = campo === "data" ? evento.data : evento.dataScadenza;

  return { stato: calcolaStatoScadenza(dataRilevante, oggi), campo };
}

/**
 * Classi Tailwind per il colore del testo di una scadenza: unica fonte di
 * verità, usata sia nel dettaglio animale sia nella vista aggregata
 * /animali/scadenze, così i due colori (rosso/arancione) restano coerenti.
 * @param stato esito di calcolaStatoScadenza o calcolaStatoEvento.
 * @returns classi Tailwind (light + dark) da applicare al testo.
 */
export function coloreScadenza(stato: StatoScadenza): string {
  if (stato === "scaduto") return "text-red-600 dark:text-red-400";
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
