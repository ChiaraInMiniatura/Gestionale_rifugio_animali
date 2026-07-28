// Schema Zod per il cambio ruolo di un utente (VOLONTARIA <-> ADMIN) fatto
// da un'altra ADMIN dal pannello di amministrazione: condiviso tra la
// rotta PATCH /api/admin/users/[id]/ruolo e il form corrispondente.

import { z } from "zod";
import { Role } from "@/generated/prisma/enums";

const roleValues = Object.values(Role) as [Role, ...Role[]];

export const cambiaRuoloSchema = z.object({
  role: z.enum(roleValues),
});

export type CambiaRuoloInput = z.infer<typeof cambiaRuoloSchema>;
