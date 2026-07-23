// Rotta collezione per il registro animali: GET restituisce l'elenco
// (per qualunque utente loggato e approvato), POST crea un nuovo animale.
// Le operazioni sul singolo animale (dettaglio, modifica, eliminazione,
// cambio stato) vivono invece in [id]/route.ts.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessioneApprovata } from "@/lib/api-auth";
import { animaleSchema, normalizzaAnimale } from "@/lib/validations/animale";

/**
 * Restituisce l'elenco degli animali, più recenti prima.
 * @returns 200 con l'array di animali (solo i campi da lista, foto
 *   esclusa apposta per non appesantire la risposta); 403 se la sessione
 *   non è valida o l'utente non è approvato.
 */
export async function GET() {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  // select esplicito (non un semplice findMany): la foto, potenzialmente
  // pesante (data URL base64), non deve mai finire in una risposta di
  // lista, solo nel dettaglio del singolo animale.
  const animali = await prisma.animale.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      specie: true,
      razza: true,
      dataNascita: true,
      stato: true,
      createdAt: true,
    },
  });
  return NextResponse.json(animali);
}

/**
 * Crea un nuovo animale a partire dai dati di base inviati dal client.
 * @param request corpo JSON validato con lo stesso schema Zod (animaleSchema)
 *   usato dal form: la validazione lato client non basta, va sempre
 *   ripetuta qui.
 * @returns 201 con l'animale creato; 400 se il body non è JSON valido o
 *   non passa Zod; 403 se la sessione non è valida o approvata.
 */
export async function POST(request: Request) {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  const parsed = animaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // normalizzaAnimale converte l'output di Zod (stringhe vuote, date come
  // stringa) nella forma attesa da Prisma (null, Date): stessa funzione
  // usata anche da PATCH, per non duplicare questa logica in due punti.
  const animale = await prisma.animale.create({ data: normalizzaAnimale(parsed.data) });
  return NextResponse.json(animale, { status: 201 });
}
