// Etichette in italiano per l'enum TipoRapporto: unica fonte di verità
// per la UI, stesso principio già applicato a TIPO_EVENTO_LABEL.

import type { TipoRapporto } from "@/generated/prisma/enums";

export const TIPO_RAPPORTO_LABEL: Record<TipoRapporto, string> = {
  AFFIDO: "Affido",
  ADOZIONE: "Adozione",
};
