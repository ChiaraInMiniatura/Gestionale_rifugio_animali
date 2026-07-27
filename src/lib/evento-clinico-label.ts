// Etichette in italiano per TipoEvento e RicorrenzaEvento: unica fonte di
// verità per la UI (form, cartella clinica, vista scadenze, dashboard),
// così le pagine non ripetono la stessa mappatura in più punti (stesso
// principio già applicato a STATO_LABEL per StatoAnimale).

import type { TipoEvento, RicorrenzaEvento } from "@/generated/prisma/enums";

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  VACCINO: "Vaccino",
  ANTIPARASSITARIO: "Antiparassitario",
  VISITA: "Visita veterinaria",
  TERAPIA: "Terapia",
};

export const RICORRENZA_LABEL: Record<RicorrenzaEvento, string> = {
  NESSUNA: "Evento singolo (con eventuale richiamo)",
  GIORNALIERA: "Terapia giornaliera continuativa",
};
