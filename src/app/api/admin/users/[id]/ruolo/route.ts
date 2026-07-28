// Rotta ADMIN-only per cambiare il ruolo di un utente (VOLONTARIA <->
// ADMIN): un cambio secco tra i due soli valori possibili, confermato da
// un popup lato client (il body qui è già la scelta finale, non serve
// altra validazione di transizione).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cambiaRuoloSchema } from "@/lib/validations/cambia-ruolo";

/**
 * Cambia il ruolo dell'utente con l'id indicato.
 * @param request corpo JSON `{ role: "ADMIN" | "VOLONTARIA" }`, validato
 *   con cambiaRuoloSchema.
 * @param params contiene l'id utente di cui cambiare il ruolo.
 * @returns 200 con l'id aggiornato; 400 per id/body non validi o Zod
 *   fallito; 403 se chi chiama non è ADMIN; 404 se l'utente non esiste;
 *   409 se l'id coincide con quello della sessione corrente (non ci si
 *   può cambiare il proprio stesso ruolo, per evitare un blocco
 *   accidentale — es. retrocedersi restando l'unica ADMIN).
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

  if (Number(session.user.id) === userId) {
    return NextResponse.json(
      { message: "Non puoi cambiare il tuo stesso ruolo" },
      { status: 409 }
    );
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

  const parsed = cambiaRuoloSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ id: userId });
}
