// Rotta ADMIN-only per approvare una richiesta di registrazione in
// attesa: imposta approved=true sull'utente, sbloccandone il login.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Approva l'account con l'id indicato nella rotta.
 * @param request non usato (nessun corpo atteso), presente per rispettare
 *   la firma richiesta dal route handler di Next.js.
 * @param params contiene l'id utente da approvare (stringa da parametro
 *   di rotta dinamica, convertita in numero).
 * @returns 200 con i dati pubblici dell'utente aggiornato; 403 se chi
 *   chiama non è ADMIN; 400/404 per id non valido o inesistente.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica del ruolo indipendente da qualunque controllo già fatto a
  // livello di pagina/proxy: ogni rotta API deve poter fidarsi solo di sé
  // stessa, perché può essere chiamata direttamente (non solo dalla UI).
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

  const user = await prisma.user.update({
    where: { id: userId },
    data: { approved: true },
  });

  // Nessun campo sensibile (password/hash) nella risposta.
  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
