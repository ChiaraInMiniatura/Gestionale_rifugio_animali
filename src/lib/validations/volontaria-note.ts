// Schema Zod per le annotazioni ad uso esclusivo dell'ADMIN su una
// volontaria (cellulare, osservazioni pratiche): condiviso tra la rotta
// PATCH /api/admin/users/[id]/note e il form corrispondente in
// VolontarieList, come per ogni altro schema del progetto.

import { z } from "zod";

export const volontariaNoteSchema = z.object({
  // Testo libero, nessuna validazione di formato — stessa scelta già
  // fatta per il campo "documento" dell'adottante: qui conta poter
  // scrivere in fretta, non normalizzare un formato.
  cellulare: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export type VolontariaNoteInput = z.infer<typeof volontariaNoteSchema>;
