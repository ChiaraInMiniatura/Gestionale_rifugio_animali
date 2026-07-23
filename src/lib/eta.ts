export function calcolaEta(dataNascita: Date | null, oggi: Date = new Date()): string | null {
  if (!dataNascita || dataNascita > oggi) {
    return null;
  }

  let anni = oggi.getFullYear() - dataNascita.getFullYear();
  let mesi = oggi.getMonth() - dataNascita.getMonth();
  const giorniDelMese = oggi.getDate() - dataNascita.getDate();

  if (giorniDelMese < 0) {
    mesi -= 1;
  }
  if (mesi < 0) {
    anni -= 1;
    mesi += 12;
  }

  if (anni >= 2) {
    return `${anni} anni`;
  }

  if (anni === 0 && mesi === 0) {
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
