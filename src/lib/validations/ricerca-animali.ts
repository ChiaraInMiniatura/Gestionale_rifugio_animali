// Filtri di ricerca per la lista /animali, letti dalla query string
// (?q=...&stato=...&specie=...). Ogni campo è validato indipendentemente
// dagli altri, mai con un solo safeParse su tutto l'oggetto: così un
// singolo parametro non riconosciuto (es. un URL modificato a mano con
// ?stato=PIPPO) non fa cadere anche gli altri filtri eventualmente
// presenti nello stesso URL.

import { z } from "zod";
import { Specie, StatoAnimale } from "@/generated/prisma/enums";

const specieValues = Object.values(Specie) as [Specie, ...Specie[]];
const statoValues = Object.values(StatoAnimale) as [StatoAnimale, ...StatoAnimale[]];

const statoSchema = z.enum(statoValues);
const specieSchema = z.enum(specieValues);

/** Filtri già validati, pronti per essere usati nella where di Prisma:
 *  ogni campo assente significa "nessun filtro su questo campo". */
export interface RicercaAnimali {
  q?: string;
  stato?: StatoAnimale;
  specie?: Specie;
}

/**
 * Legge e valida i parametri di ricerca dalla query string di /animali.
 * Usa `.safeParse` (mai `.parse`): un valore non valido va ignorato in
 * silenzio, non deve generare un errore mostrato alla volontaria per una
 * query string malformata — gli altri filtri eventualmente validi restano
 * comunque attivi.
 * @param searchParams parametri grezzi ricevuti dalla pagina (stringhe o
 *   assenti, come restituiti da Next.js).
 * @returns solo i filtri riconosciuti come validi; `q` vuoto dopo il trim
 *   è trattato come assente (nessuna ricerca testuale).
 */
export function parseRicercaAnimali(searchParams: {
  q?: string;
  stato?: string;
  specie?: string;
}): RicercaAnimali {
  const q = searchParams.q?.trim();
  const stato = statoSchema.safeParse(searchParams.stato);
  const specie = specieSchema.safeParse(searchParams.specie);

  return {
    q: q ? q : undefined,
    stato: stato.success ? stato.data : undefined,
    specie: specie.success ? specie.data : undefined,
  };
}
