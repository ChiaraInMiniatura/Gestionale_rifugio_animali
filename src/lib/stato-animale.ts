import type { StatoAnimale } from "@/generated/prisma/enums";

export const STATO_LABEL: Record<StatoAnimale, string> = {
  DISPONIBILE: "Disponibile",
  IN_AFFIDO: "In affido",
  ADOTTATO: "Adottato",
};
