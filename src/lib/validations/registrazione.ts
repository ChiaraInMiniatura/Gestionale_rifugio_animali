import { z } from "zod";

export const registrazioneSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  email: z.email("Inserisci un indirizzo email valido"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export type RegistrazioneInput = z.infer<typeof registrazioneSchema>;
