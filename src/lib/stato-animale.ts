// Etichette in italiano per l'enum StatoAnimale: unica fonte di verità
// per la UI, così le pagine (elenco, dettaglio) non ripetono la stessa
// mappatura in più punti.

import type { StatoAnimale } from "@/generated/prisma/enums";

export const STATO_LABEL: Record<StatoAnimale, string> = {
  DISPONIBILE: "Disponibile",
  IN_AFFIDO: "In affido",
  ADOTTATO: "Adottato",
};
