// Schema Zod condiviso tra i form della cartella clinica (client) e le
// rotte API sotto /api/animali/[id]/eventi (server): stessa validazione
// usata in entrambi i punti, così un bypass del form non aggira i controlli.

import { z } from "zod";
import { TipoEvento, RicorrenzaEvento } from "@/generated/prisma/enums";

const tipoValues = Object.values(TipoEvento) as [TipoEvento, ...TipoEvento[]];
const ricorrenzaValues = Object.values(RicorrenzaEvento) as [
  RicorrenzaEvento,
  ...RicorrenzaEvento[],
];

// Le date arrivano come stringa da input datetime-local ("YYYY-MM-DDTHH:mm",
// senza timezone): si valida con new Date(...).getTime(), non con
// z.string().datetime() di Zod, che pretende un formato ISO con secondi e
// suffisso "Z" incompatibile con l'input HTML usato nei form.
function datetimeValido(v: string) {
  return !Number.isNaN(new Date(v).getTime());
}

export const eventoClinicoSchema = z
  .object({
    tipo: z.enum(tipoValues),
    nomeSpecifico: z.string().trim().min(1, "Il nome specifico è obbligatorio"),
    data: z.string().min(1, "La data è obbligatoria").refine(datetimeValido, "Data non valida"),
    ricorrenza: z.enum(ricorrenzaValues).default(RicorrenzaEvento.NESSUNA),
    dataScadenza: z
      .string()
      .optional()
      .refine((v) => !v || datetimeValido(v), "Data di scadenza non valida"),
    dataFine: z
      .string()
      .optional()
      .refine((v) => !v || datetimeValido(v), "Data di fine non valida"),
    note: z.string().trim().optional(),
  })
  // Vincolo di mutua esclusione (stesso principio già applicato a
  // stato/CAMPI_BASE in /api/animali/[id]/route.ts): dataScadenza e
  // dataFine appartengono a semantiche diverse (richiamo singolo vs
  // interruzione terapia) e non possono convivere sullo stesso evento.
  .refine((v) => v.ricorrenza !== "GIORNALIERA" || !v.dataScadenza, {
    message: "La scadenza non si applica alle terapie giornaliere",
    path: ["dataScadenza"],
  })
  .refine((v) => v.ricorrenza !== "NESSUNA" || !v.dataFine, {
    message: "La data di fine si applica solo alle terapie giornaliere",
    path: ["dataFine"],
  });

export type EventoClinicoInput = z.infer<typeof eventoClinicoSchema>;

/**
 * Converte l'output validato di eventoClinicoSchema nella forma attesa da
 * Prisma: stringhe datetime → Date, campi opzionali assenti → null.
 * @param input dati già validati da eventoClinicoSchema.safeParse.
 * @returns oggetto pronto per prisma.eventoClinico.create/update.
 */
export function normalizzaEventoClinico(input: EventoClinicoInput) {
  return {
    tipo: input.tipo,
    nomeSpecifico: input.nomeSpecifico,
    data: new Date(input.data),
    ricorrenza: input.ricorrenza,
    dataScadenza: input.dataScadenza ? new Date(input.dataScadenza) : null,
    dataFine: input.dataFine ? new Date(input.dataFine) : null,
    note: input.note && input.note.length > 0 ? input.note : null,
  };
}
