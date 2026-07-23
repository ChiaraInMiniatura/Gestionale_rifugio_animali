// Schema Zod condiviso tra AnimaleForm (client) e le rotte API
// /api/animali e /api/animali/[id] (server): stessa validazione usata in
// entrambi i punti, così un bypass del form non aggira i controlli.

import { z } from "zod";
import { Specie, StatoAnimale, Sesso } from "@/generated/prisma/enums";

const specieValues = Object.values(Specie) as [Specie, ...Specie[]];
const statoValues = Object.values(StatoAnimale) as [StatoAnimale, ...StatoAnimale[]];
const sessoValues = Object.values(Sesso) as [Sesso, ...Sesso[]];

// Soglia di sicurezza server-side, indipendente dalla compressione lato
// client: si applica alla lunghezza della stringa data URL memorizzata
// (non ai byte binari dell'immagine, ~33% in meno per via della codifica).
export const FOTO_MAX_LENGTH = 1.5 * 1024 * 1024;
const FOTO_PREFIX_REGEX = /^data:image\/(jpeg|png);base64,/;

export const animaleSchema = z.object({
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  specie: z.enum(specieValues),
  razza: z.string().trim().optional(),
  dataNascita: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Data non valida"),
  descrizione: z.string().trim().optional(),
  note: z.string().trim().optional(),
  foto: z
    .string()
    .optional()
    .refine((v) => !v || FOTO_PREFIX_REGEX.test(v), "Formato immagine non valido")
    .refine((v) => !v || v.length <= FOTO_MAX_LENGTH, "L'immagine è troppo grande"),
     // sesso e sterilizzato sono entrambi .optional(): l'assenza (undefined)
     // rappresenta "non specificato", coerente con i campi nullable dello
     // schema Prisma (vedi prisma/schema.prisma).
     sesso: z.enum(sessoValues).optional(),
     sterilizzato: z.boolean().optional(),
   });

export type AnimaleInput = z.infer<typeof animaleSchema>;

// Converte l'output validato di animaleSchema nella forma attesa da Prisma:
// stringa vuota/assente → null, stringa data → Date. Unica definizione,
// usata sia da POST (creazione) sia da PATCH (modifica dati di base).
export function normalizzaAnimale(input: AnimaleInput) {
  return {
    nome: input.nome,
    specie: input.specie,
    razza: input.razza && input.razza.length > 0 ? input.razza : null,
    dataNascita: input.dataNascita ? new Date(input.dataNascita) : null,
    descrizione: input.descrizione && input.descrizione.length > 0 ? input.descrizione : null,
    note: input.note && input.note.length > 0 ? input.note : null,
    foto: input.foto && input.foto.length > 0 ? input.foto : null,
    // undefined → null: stesso trattamento "non specificato" applicato
    // sopra in Zod, ora nella forma richiesta dal client Prisma.
    sesso: input.sesso ?? null,
    sterilizzato: input.sterilizzato ?? null,
  };
}

// statoAnimaleSchema è deliberatamente un oggetto separato da
// animaleSchema, non un campo opzionale al suo interno: la rotta PATCH
// in [id]/route.ts usa la presenza/assenza del campo "stato" nel body
// per decidere quale dei due schemi applicare (vedi CAMPI_BASE lì).
export const statoAnimaleSchema = z.object({
  stato: z.enum(statoValues),
});

export type StatoAnimaleInput = z.infer<typeof statoAnimaleSchema>;
