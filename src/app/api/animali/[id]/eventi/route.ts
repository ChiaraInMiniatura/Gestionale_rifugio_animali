// Rotta collezione degli eventi clinici di un animale: POST crea un nuovo
// evento nella sua cartella clinica. Le operazioni sul singolo evento
// (modifica, eliminazione) vivono in [eventoId]/route.ts.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessioneApprovata } from "@/lib/api-auth";
import { eventoClinicoSchema, normalizzaEventoClinico } from "@/lib/validations/evento-clinico";
import { generaProssimoEventoSeServe } from "@/lib/genera-prossimo-evento";

/**
 * Crea un nuovo evento clinico per l'animale indicato nel path. Nessun
 * controllo di ruolo oltre alla sessione approvata: chi può registrare
 * un vaccino/terapia/visita è chiunque operi quotidianamente sui dati
 * (VOLONTARIA inclusa), non un'operazione ADMIN-only.
 * @param request corpo JSON validato con eventoClinicoSchema (stessa
 *   validazione del form, ripetuta qui perché non ci si fida del client).
 * @param params contiene l'id dell'animale a cui l'evento appartiene.
 * @returns 201 con l'evento creato; 400 per id/body non validi o Zod
 *   fallito; 403 se la sessione non è valida o approvata; 404 se
 *   l'animale non esiste.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  const animale = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!animale) {
    return NextResponse.json({ message: "Animale non trovato" }, { status: 404 });
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

  // Calcolato esplicitamente, non lasciato al default true dello schema:
  // un appuntamento futuro non ancora avvenuto nasce non confermato, così
  // viene subito segnalato come promemoria (vedi calcolaStatoEvento in
  // src/lib/scadenza.ts). Vale per NESSUNA/MENSILE/ANNUALE: le terapie
  // giornaliere non usano mai questo campo, restano confermato=true per
  // coerenza.
  const ricorrenzaConConferma = parsed.data.ricorrenza !== "GIORNALIERA";
  const confermato = !(ricorrenzaConConferma && new Date(parsed.data.data) > new Date());

  const evento = await prisma.eventoClinico.create({
    data: { ...normalizzaEventoClinico(parsed.data), animaleId, confermato },
  });

  // Log retrospettivo (data già passata) di un evento Mensile/Annuale:
  // nasce già confermato, quindi genera subito il richiamo successivo.
  await generaProssimoEventoSeServe(evento);

  return NextResponse.json(evento, { status: 201 });
}
