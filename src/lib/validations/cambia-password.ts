// Schema Zod per il cambio password di una volontaria fatto dall'ADMIN
// (rotta PATCH /api/admin/users/[id]/password): riusa la stessa regola
// di lunghezza minima già definita per la registrazione, invece di
// duplicarla — un'unica fonte di verità per "cos'è una password valida".

import { z } from "zod";
import { registrazioneSchema } from "@/lib/validations/registrazione";

export const cambiaPasswordSchema = z.object({
  password: registrazioneSchema.shape.password,
});

export type CambiaPasswordInput = z.infer<typeof cambiaPasswordSchema>;
