// Rotta per il singolo evento clinico: PATCH (modifica) e DELETE
// (eliminazione). A differenza delle operazioni ADMIN-only su Animale,
// qui chiunque loggato e approvato può sia creare sia modificare/eliminare
// un evento: nessuna distinzione di ruolo su questo dominio.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessioneApprovata } from "@/lib/api-auth";
import { eventoClinicoSchema, normalizzaEventoClinico } from "@/lib/validations/evento-clinico";

/**
 * Aggiorna un evento clinico esistente (sostituzione completa dei campi,
 * stesso schema usato in creazione).
 * @param request corpo JSON validato con eventoClinicoSchema.
 * @param params contiene l'id dell'animale e dell'evento da modificare.
 * @returns 200 con l'evento aggiornato; 400 per id/body non validi o Zod
 *   fallito; 403 se la sessione non è valida o approvata; 404 se l'evento
 *   non esiste o non appartiene all'animale indicato nel path.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; eventoId: string }> }
) {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id, eventoId: eventoIdParam } = await params;
  const animaleId = Number(id);
  const eventoId = Number(eventoIdParam);
  if (Number.isNaN(animaleId) || Number.isNaN(eventoId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  // Verifica che l'evento esista E appartenga davvero all'animale del
  // path: non basta che esista un evento con quell'id da qualche parte.
  const existing = await prisma.eventoClinico.findUnique({ where: { id: eventoId } });
  if (!existing || existing.animaleId !== animaleId) {
    return NextResponse.json({ message: "Evento non trovato" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  const parsed = eventoClinicoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const evento = await prisma.eventoClinico.update({
    where: { id: eventoId },
    data: normalizzaEventoClinico(parsed.data),
  });
  return NextResponse.json(evento);
}

/**
 * Elimina definitivamente un evento clinico. Aperta a chiunque loggato e
 * approvato (non ADMIN-only): coerente con il fatto che la stessa persona
 * può anche crearlo/modificarlo, la cartella clinica non ha un vincolo di
 * ruolo separato come invece l'eliminazione di un intero Animale.
 * @param request non usato, presente per la firma del route handler.
 * @param params contiene l'id dell'animale e dell'evento da eliminare.
 * @returns 200 con l'id eliminato; 400 per id non validi; 403 se la
 *   sessione non è valida o approvata; 404 se l'evento non esiste o non
 *   appartiene all'animale indicato nel path.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventoId: string }> }
) {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id, eventoId: eventoIdParam } = await params;
  const animaleId = Number(id);
  const eventoId = Number(eventoIdParam);
  if (Number.isNaN(animaleId) || Number.isNaN(eventoId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  const existing = await prisma.eventoClinico.findUnique({ where: { id: eventoId } });
  if (!existing || existing.animaleId !== animaleId) {
    return NextResponse.json({ message: "Evento non trovato" }, { status: 404 });
  }

  await prisma.eventoClinico.delete({ where: { id: eventoId } });
  return NextResponse.json({ id: eventoId });
}
