// Rotta per il singolo evento clinico: PATCH (modifica) e DELETE
// (eliminazione). A differenza delle operazioni ADMIN-only su Animale,
// qui chiunque loggato e approvato può sia creare sia modificare/eliminare
// un evento: nessuna distinzione di ruolo su questo dominio.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessioneApprovata } from "@/lib/api-auth";
import { eventoClinicoSchema, normalizzaEventoClinico } from "@/lib/validations/evento-clinico";
import { generaProssimoEventoSeServe } from "@/lib/genera-prossimo-evento";

/**
 * Aggiorna un evento clinico esistente. Due modalità mutuamente esclusive
 * nello stesso body, distinte dalla presenza (esclusiva) del campo
 * "confermato" — stesso principio già usato per stato/CAMPI_BASE in
 * /api/animali/[id]/route.ts:
 * - Body { confermato: boolean } e nient'altro: azione dedicata
 *   conferma/annulla conferma, per ricorrenza NESSUNA/MENSILE/ANNUALE
 *   (mai GIORNALIERA). Sulla transizione false → true di un evento
 *   Mensile/Annuale, genera anche il richiamo successivo della stessa
 *   serie (vedi src/lib/genera-prossimo-evento.ts).
 * - Body senza "confermato": sostituzione completa degli altri campi,
 *   validata con eventoClinicoSchema (comportamento invariato). Il campo
 *   confermato non viene mai toccato da questo ramo, per non confermare
 *   per sbaglio un evento mentre si corregge un refuso in una nota. Prima
 *   di sovrascrivere, salva un'istantanea dei valori precedenti in
 *   EventoClinicoStorico (il ramo "confermato" sopra non lo fa mai).
 * @param request corpo JSON, in uno dei due formati sopra.
 * @param params contiene l'id dell'animale e dell'evento da modificare.
 * @returns 200 con l'evento aggiornato; 400 per id/body non validi, Zod
 *   fallito, "confermato" misto ad altri campi, o "confermato" su una
 *   terapia giornaliera; 403 se la sessione non è valida o approvata;
 *   404 se l'evento non esiste o non appartiene all'animale del path.
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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  const haCampoConfermato = Object.prototype.hasOwnProperty.call(body, "confermato");

  if (haCampoConfermato) {
    // "Esattamente e solo" confermato: qualunque altro campo nello stesso
    // body rende la richiesta ambigua (le due modalità non si mescolano).
    if (Object.keys(body).length > 1) {
      return NextResponse.json(
        { message: "Non è possibile modificare \"confermato\" insieme ad altri campi" },
        { status: 400 }
      );
    }

    const { confermato } = body as { confermato: unknown };
    if (typeof confermato !== "boolean") {
      return NextResponse.json({ message: "Dati non validi" }, { status: 400 });
    }

    // Il concetto di conferma esiste per NESSUNA/MENSILE/ANNUALE, mai
    // per GIORNALIERA: una terapia continuativa non ha un "appuntamento"
    // singolo da confermare.
    if (existing.ricorrenza === "GIORNALIERA") {
      return NextResponse.json(
        { message: "Non applicabile alle terapie giornaliere" },
        { status: 400 }
      );
    }

    const evento = await prisma.eventoClinico.update({
      where: { id: eventoId },
      data: { confermato },
    });

    // Solo sulla transizione false → true (non ad ogni conferma ripetuta,
    // vedi la guardia "prossimoGenerato" dentro l'helper): genera il
    // richiamo successivo per le serie Mensile/Annuale.
    if (!existing.confermato && confermato) {
      await generaProssimoEventoSeServe(evento);
    }
    return NextResponse.json(evento);
  }

  const parsed = eventoClinicoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Istantanea dei valori PRIMA di applicare la modifica (già letti sopra
  // per la verifica di appartenenza, nessuna query aggiuntiva): solo
  // questo ramo genera storico, mai il PATCH dedicato "confermato" sopra
  // (troppo frequente, non è una modifica del contenuto clinico).
  await prisma.eventoClinicoStorico.create({
    data: {
      eventoId: existing.id,
      tipo: existing.tipo,
      nomeSpecifico: existing.nomeSpecifico,
      data: existing.data,
      dataScadenza: existing.dataScadenza,
      ricorrenza: existing.ricorrenza,
      dataFine: existing.dataFine,
      confermato: existing.confermato,
      note: existing.note,
    },
  });

  const evento = await prisma.eventoClinico.update({
    where: { id: eventoId },
    data: normalizzaEventoClinico(parsed.data),
  });

  // Copre il caso in cui questa modifica renda l'evento MENSILE/ANNUALE
  // e già confermato (es. cambiando qui la frequenza su un evento creato
  // in precedenza): generaProssimoEventoSeServe ha già tutte le guardie
  // necessarie (ricorrenza, confermato, prossimoGenerato), quindi è
  // sicuro chiamarla anche qui, non solo dal ramo "confermato" sopra —
  // altrimenti un evento del genere resterebbe senza successore.
  await generaProssimoEventoSeServe(evento);
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
