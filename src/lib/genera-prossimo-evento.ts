// Generazione automatica del prossimo evento di una serie periodica
// (MENSILE/ANNUALE): richiamato sia dalla creazione (POST, log
// retrospettivo già confermato) sia dalla conferma esplicita (PATCH
// confermato), gli unici due punti in cui un evento periodico può
// risultare confermato=true.

import { addMonths, addYears, format } from "date-fns";
import { it } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import type { EventoClinico } from "@/generated/prisma/client";

/**
 * Se l'evento passato è di ricorrenza MENSILE/ANNUALE, è confermato e non
 * ha già generato il proprio successore, crea il prossimo evento della
 * stessa serie (stesso tipo/nome, data spostata di un mese/anno) e segna
 * l'originale come "prossimoGenerato" per non farlo scattare di nuovo.
 * Nessun effetto per le altre ricorrenze, per un evento non confermato,
 * o se il successore è già stato generato in precedenza (guardia contro
 * i duplicati su conferma/annulla/riconferma ripetuti).
 * @param evento l'evento clinico dopo l'ultimo aggiornamento (già scritto
 *   su database), con i valori attuali di ricorrenza/confermato/
 *   prossimoGenerato.
 */
export async function generaProssimoEventoSeServe(evento: EventoClinico): Promise<void> {
  const periodico = evento.ricorrenza === "MENSILE" || evento.ricorrenza === "ANNUALE";
  if (!periodico || !evento.confermato || evento.prossimoGenerato) {
    return;
  }

  const prossimaData =
    evento.ricorrenza === "MENSILE" ? addMonths(evento.data, 1) : addYears(evento.data, 1);

  await prisma.eventoClinico.create({
    data: {
      animaleId: evento.animaleId,
      tipo: evento.tipo,
      nomeSpecifico: evento.nomeSpecifico,
      data: prossimaData,
      ricorrenza: evento.ricorrenza,
      dataScadenza: null,
      dataFine: null,
      confermato: false,
      note: `Generato automaticamente dopo la conferma del richiamo del ${format(evento.data, "d MMMM yyyy", { locale: it })}.`,
    },
  });

  await prisma.eventoClinico.update({
    where: { id: evento.id },
    data: { prossimoGenerato: true },
  });
}
