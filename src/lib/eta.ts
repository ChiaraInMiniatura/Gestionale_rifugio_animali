// Calcolo dell'età di un animale a partire dalla data di nascita, con
// formattazione a granularità decrescente: giorni sotto il mese, mesi
// sotto l'anno, anno/i più eventuali mesi sotto i 2 anni, solo anni da 2
// anni in su. L'età non viene mai salvata come valore a parte nel DB
// (diventerebbe disallineata nel tempo): si calcola sempre al volo da qui.

/**
 * Calcola l'età di un animale in forma leggibile.
 * @param dataNascita data di nascita, o null se non nota (in quel caso
 *   nessuna età può essere calcolata).
 * @param oggi data di riferimento per il calcolo; di default `new Date()`,
 *   ma parametrizzabile per rendere la funzione testabile senza dipendere
 *   dall'orologio di sistema.
 * @returns una stringa come "3 giorni", "5 mesi", "1 anno e 2 mesi",
 *   "4 anni"; null se dataNascita è null o è nel futuro rispetto a oggi.
 */
export function calcolaEta(dataNascita: Date | null, oggi: Date = new Date()): string | null {
  if (!dataNascita || dataNascita > oggi) {
    return null;
  }

  let anni = oggi.getFullYear() - dataNascita.getFullYear();
  let mesi = oggi.getMonth() - dataNascita.getMonth();
  const giorniDelMese = oggi.getDate() - dataNascita.getDate();

  // Calendario a "presi in prestito": se il giorno del mese non è ancora
  // arrivato, l'ultimo mese/anno pieno non è ancora compiuto.
  if (giorniDelMese < 0) {
    mesi -= 1;
  }
  if (mesi < 0) {
    anni -= 1;
    mesi += 12;
  }

  // Da 2 anni in su si arrotonda ai soli anni: sotto quella soglia il
  // dettaglio in mesi/giorni è più utile per il monitoraggio sanitario
  // dei cuccioli.
  if (anni >= 2) {
    return `${anni} anni`;
  }

  if (anni === 0 && mesi === 0) {
    // Differenza in giorni calcolata con Date.UTC per evitare l'effetto
    // dell'ora legale/solare sulla sottrazione diretta di due Date.
    const giorni = Math.floor(
      (Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate()) -
        Date.UTC(dataNascita.getFullYear(), dataNascita.getMonth(), dataNascita.getDate())) /
        86400000
    );
    return `${giorni} ${giorni === 1 ? "giorno" : "giorni"}`;
  }

  if (anni === 0) {
    return `${mesi} ${mesi === 1 ? "mese" : "mesi"}`;
  }

  if (mesi === 0) {
    return `${anni} anno`;
  }

  return `${anni} anno e ${mesi} ${mesi === 1 ? "mese" : "mesi"}`;
}
