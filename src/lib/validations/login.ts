import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "Inserisci la password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
