// Rotta ADMIN-only per rifiutare una richiesta di registrazione in
// attesa: qui "rifiutare" significa eliminare definitivamente l'account
// non approvato (non esiste uno stato "rifiutato" nello schema).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Elimina definitivamente l'account non approvato con l'id indicato.
 * @param request non usato, presente per la firma del route handler.
 * @param params contiene l'id utente da rifiutare/eliminare.
 * @returns 200 con l'id eliminato; 403 se chi chiama non è ADMIN; 400/404
 *   per id non valido o inesistente; 409 se l'utente è già approvato
 *   (non è più una richiesta in attesa, quindi non va eliminato da qui).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Stesso principio della rotta di approvazione: il ruolo ADMIN va
  // riverificato qui, indipendentemente da proxy o pagina chiamante.
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return NextResponse.json({ message: "Utente non trovato" }, { status: 404 });
  }

  // Guardia di coerenza: questa rotta serve solo a eliminare richieste
  // ancora in attesa. Un utente già approvato va eventualmente gestito
  // con un percorso diverso, non con una "rejection" tardiva.
  if (existing.approved) {
    return NextResponse.json(
      { message: "Non è una richiesta in attesa: l'utente è già approvato" },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ id: userId });
}
