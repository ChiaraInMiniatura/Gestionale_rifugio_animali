// Rotta ADMIN-only per eliminare definitivamente una volontaria già
// confermata: concettualmente diversa da "reject" (che invece rifiuta
// solo richieste ancora in attesa, mai attivate) — qui si chiude un
// account già in uso.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Elimina definitivamente l'account confermato con l'id indicato.
 * @param request non usato, presente per la firma del route handler.
 * @param params contiene l'id utente da eliminare.
 * @returns 200 con l'id eliminato; 403 se chi chiama non è ADMIN; 400/404
 *   per id non valido o inesistente; 409 se l'utente non è ancora
 *   approvato (è una richiesta in attesa, va gestita con "Rifiuta" invece
 *   che con questa rotta — guardia inversa rispetto a .../reject), oppure
 *   se l'id coincide con quello della sessione corrente (non ci si può
 *   eliminare da sole, per evitare un blocco accidentale).
 */
export async function DELETE(
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

  // Non ci si può eliminare da sole: prima del controllo "esiste?", così
  // il messaggio è chiaro anche se l'id è il proprio (che esiste di certo).
  if (Number(session.user.id) === userId) {
    return NextResponse.json(
      { message: "Non puoi eliminare il tuo stesso account" },
      { status: 409 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return NextResponse.json({ message: "Utente non trovato" }, { status: 404 });
  }

  // Guardia di coerenza, inversa rispetto a .../reject: questa rotta
  // serve solo a eliminare account già confermati, non richieste ancora
  // in attesa (quelle si rifiutano, non si "eliminano").
  if (!existing.approved) {
    return NextResponse.json(
      { message: "Non è un account confermato: è ancora una richiesta in attesa" },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ id: userId });
}
