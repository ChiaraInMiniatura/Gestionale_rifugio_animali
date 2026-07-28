// Rotta ADMIN-only per impostare una nuova password a una volontaria per
// suo conto: nessuna richiesta della password attuale, perché non è lei
// a operare. Scelta di prodotto (non solo tecnica): le volontarie non
// gestiscono da sole la propria password, chiedono sempre all'ADMIN.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cambiaPasswordSchema } from "@/lib/validations/cambia-password";

/**
 * Imposta una nuova password per la volontaria con l'id indicato.
 * @param request corpo JSON `{ password }`, validato con
 *   cambiaPasswordSchema (stessa regola di lunghezza minima usata in
 *   registrazione).
 * @param params contiene l'id utente di cui cambiare la password.
 * @returns 200 con l'id aggiornato; 400 per id/body non validi o Zod
 *   fallito; 403 se chi chiama non è ADMIN; 404 se l'utente non esiste.
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

  const parsed = cambiaPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Costo 10, stesso valore usato in /api/registrazione: la password in
  // chiaro non tocca mai il database.
  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ id: userId });
}
