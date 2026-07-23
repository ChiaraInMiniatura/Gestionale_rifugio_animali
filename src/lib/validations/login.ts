// Schema Zod per il form di login: validazione minimale (formato email,
// password non vuota), perché il controllo vero delle credenziali
// avviene comunque lato server nell'authorize() di src/lib/auth.ts.

import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "Inserisci la password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
