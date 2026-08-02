// Etichette in italiano per l'enum StatoAnimale: unica fonte di verità
// per la UI, così le pagine (elenco, dettaglio) non ripetono la stessa
// mappatura in più punti.

import type { StatoAnimale } from "@/generated/prisma/enums";

export const STATO_LABEL: Record<StatoAnimale, string> = {
  DISPONIBILE: "Disponibile",
  IN_AFFIDO: "In affido",
  ADOTTATO: "Adottato",
};

// Classi del badge a pillola per stato (MOD13): verde per gli stati "fermi"
// (disponibile o adottato), ambra per l'affido perché è una situazione
// transitoria in attesa di un esito definitivo.
export const STATO_BADGE_CLASS: Record<StatoAnimale, string> = {
  DISPONIBILE: "bg-positive-soft text-positive",
  IN_AFFIDO: "bg-warn-soft text-warn",
  ADOTTATO: "bg-positive-soft text-positive",
};
