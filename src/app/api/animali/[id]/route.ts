// Rotta per il singolo animale: GET (dettaglio), PATCH (due usi distinti:
// modifica dati di base oppure cambio stato) e DELETE (eliminazione,
// ADMIN-only). Il PATCH accetta "stato" oppure gli altri campi in
// CAMPI_BASE, mai entrambi nella stessa richiesta: sono due permessi
// diversi (chiunque approvato vs solo ADMIN) e mescolarli renderebbe
// ambiguo cosa autorizzare. Il ramo "stato" gestisce anche il record
// Adozione collegato (affido/adozione con dati della persona) quando lo
// stato passa a/da IN_AFFIDO o ADOTTATO — vedi il commento più sotto,
// dentro il ramo, per la logica completa.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessioneApprovata } from "@/lib/api-auth";
import { animaleSchema, normalizzaAnimale, statoAnimaleSchema } from "@/lib/validations/animale";

// Elenco dei campi "dati di base": usato per rilevare se una richiesta
// PATCH sta toccando altro oltre allo stato, e quindi va rifiutata se
// insieme è presente anche "stato" (vedi haCampoStato/haAltriCampi sotto).
const CAMPI_BASE = ["nome", "specie", "razza", "dataNascita", "descrizione", "note", "sesso", "sterilizzato"];

/**
 * Restituisce il dettaglio completo di un animale (foto inclusa).
 * @param request non usato, presente per la firma del route handler.
 * @param params contiene l'id dell'animale da parametro di rotta dinamica.
 * @returns 200 con l'animale; 403 se la sessione non è valida/approvata;
 *   400/404 per id non valido o animale inesistente.
 */
export async function GET(
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

  return NextResponse.json(animale);
}

/**
 * Aggiorna un animale: due modalità mutuamente esclusive nello stesso
 * body, distinte dalla presenza del campo "stato".
 * - Con "stato": cambia solo lo stato di adozione (ADMIN-only). Se lo
 *   stato passa a IN_AFFIDO/ADOTTATO senza un rapporto Adozione già
 *   aperto per l'animale, richiede anche nome/cognome/cellulare/documento
 *   (nuovo rapporto); se un rapporto è già aperto, li aggiorna solo se
 *   forniti (es. affido che diventa adozione, dati invariati). Se lo
 *   stato torna a DISPONIBILE, chiude l'eventuale rapporto aperto.
 * - Senza "stato": aggiorna i campi di CAMPI_BASE (chiunque approvato).
 * @param request corpo JSON da rivalidare con lo schema Zod pertinente al
 *   ramo (statoAnimaleSchema oppure animaleSchema).
 * @param params contiene l'id dell'animale da modificare.
 * @returns 200 con l'animale aggiornato; 400 per body non valido, Zod
 *   fallito, "stato" misto ad altri campi, o dati persona mancanti per un
 *   nuovo affido/adozione; 403 per sessione non valida o (nel ramo stato)
 *   ruolo diverso da ADMIN; 404 se non esiste.
 */
export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  const haCampoStato = Object.prototype.hasOwnProperty.call(body, "stato");

  // Cambio di stato: operazione separata, riservata all'ADMIN.
  // getSessioneApprovata() verifica solo sessione+approved: il ruolo
  // va controllato qui, in aggiunta, per questo ramo specifico.
  if (haCampoStato && session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const haAltriCampi = CAMPI_BASE.some((campo) =>
    Object.prototype.hasOwnProperty.call(body, campo)
  );

  // Rifiuto esplicito del caso misto: evita che una singola richiesta
  // aggiri il controllo ruolo aggiungendo campi extra insieme a "stato",
  // o che un cambio stato modifichi "di striscio" altri dati.
  if (haCampoStato && haAltriCampi) {
    return NextResponse.json(
      {
        message:
          "Non è possibile modificare lo stato insieme ad altri campi nella stessa richiesta",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!existing) {
    return NextResponse.json({ message: "Animale non trovato" }, { status: 404 });
  }

  if (haCampoStato) {
    const parsed = statoAnimaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      stato: nuovoStato,
      personaNome: nome,
      personaCognome: cognome,
      personaCellulare: cellulare,
      personaDocumento: documento,
      personaNote: note,
    } = parsed.data;

    // Il record Adozione "aperto" (dataFine: null) rappresenta il rapporto
    // in corso con l'animale, se c'è: la sua presenza/assenza decide se
    // questo cambio di stato crea un nuovo rapporto, aggiorna quello
    // esistente, o lo chiude — non è esprimibile in un semplice campo
    // Zod, va verificato qui.
    const adozioneAperta = await prisma.adozione.findFirst({
      where: { animaleId, dataFine: null },
    });

    if (nuovoStato === "DISPONIBILE") {
      // Rientro al rifugio: chiude l'eventuale rapporto in corso, nessun
      // dato persona richiesto per questa transizione.
      if (adozioneAperta) {
        await prisma.adozione.update({
          where: { id: adozioneAperta.id },
          data: { dataFine: new Date() },
        });
      }
    } else {
      // IN_AFFIDO o ADOTTATO: il tipo di rapporto segue lo stato scelto.
      const tipo = nuovoStato === "ADOTTATO" ? "ADOZIONE" : "AFFIDO";

      if (!adozioneAperta) {
        // Nessun rapporto in corso: è un nuovo affido/adozione, i dati
        // della persona sono obbligatori.
        if (!nome || !cognome || !cellulare || !documento) {
          return NextResponse.json(
            {
              message:
                "Nome, cognome, cellulare e documento sono obbligatori per affidare o adottare un animale",
            },
            { status: 400 }
          );
        }
        await prisma.adozione.create({
          data: {
            animaleId,
            tipo,
            nome,
            cognome,
            cellulare,
            documento,
            note: note && note.length > 0 ? note : null,
            dataInizio: new Date(),
          },
        });
      } else {
        // Rapporto già in corso (es. un affido che diventa adozione):
        // cambia solo il tipo, dataInizio resta quella originale. I dati
        // persona si aggiornano solo se rinviati (permette di correggerli
        // senza obbligare a reinserirli tutti).
        await prisma.adozione.update({
          where: { id: adozioneAperta.id },
          data: {
            tipo,
            ...(nome ? { nome } : {}),
            ...(cognome ? { cognome } : {}),
            ...(cellulare ? { cellulare } : {}),
            ...(documento ? { documento } : {}),
            ...(note !== undefined ? { note: note.length > 0 ? note : null } : {}),
          },
        });
      }
    }

    const animale = await prisma.animale.update({
      where: { id: animaleId },
      data: { stato: nuovoStato },
    });
    return NextResponse.json(animale);
  }

  const parsed = animaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Stessa normalizzazione usata dal POST di creazione: garantisce che
  // stringhe vuote/date testuali diventino null/Date in modo identico nei
  // due punti in cui si scrive un Animale.
  const animale = await prisma.animale.update({
    where: { id: animaleId },
    data: normalizzaAnimale(parsed.data),
  });
  return NextResponse.json(animale);
}

/**
 * Elimina definitivamente un animale (azione distruttiva, ADMIN-only).
 * @param request non usato, presente per la firma del route handler.
 * @param params contiene l'id dell'animale da eliminare.
 * @returns 200 con l'id eliminato; 403 se la sessione non è valida o il
 *   ruolo non è ADMIN; 400/404 per id non valido o inesistente.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessioneApprovata();
  // Eliminazione riservata all'ADMIN: getSessioneApprovata() non basta,
  // serve il controllo esplicito del ruolo anche qui.
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  const existing = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!existing) {
    return NextResponse.json({ message: "Animale non trovato" }, { status: 404 });
  }

  await prisma.animale.delete({ where: { id: animaleId } });
  return NextResponse.json({ id: animaleId });
}
