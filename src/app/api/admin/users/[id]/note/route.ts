// Rotta ADMIN-only per aggiornare cellulare/note di una volontaria:
// indipendente da approve/reject/elimina, funziona a prescindere dallo
// stato di approvazione (un admin può voler annotare qualcosa anche
// prima di approvare una richiesta).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { volontariaNoteSchema } from "@/lib/validations/volontaria-note";

/**
 * Aggiorna cellulare/note della volontaria con l'id indicato. Dato
 * sensibile ad uso esclusivo dell'ADMIN: non va mai restituito né usato
 * in nessuna rotta o pagina visibile alla volontaria stessa.
 * @param request corpo JSON validato con volontariaNoteSchema.
 * @param params contiene l'id utente da annotare.
 * @returns 200 con l'utente aggiornato (solo id, per conferma); 400 per
 *   id/body non validi o Zod fallito; 403 se chi chiama non è ADMIN;
 *   404 se l'utente non esiste.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  const parsed = volontariaNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      cellulare: parsed.data.cellulare && parsed.data.cellulare.length > 0 ? parsed.data.cellulare : null,
      note: parsed.data.note && parsed.data.note.length > 0 ? parsed.data.note : null,
    },
  });

  return NextResponse.json({ id: userId });
}
