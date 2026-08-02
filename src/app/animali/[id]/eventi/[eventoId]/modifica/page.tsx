// Pagina di modifica evento clinico: stesso EventoClinicoForm della
// creazione, ma con eventoIniziale valorizzato — è questo a far scegliere
// al form la modalità PATCH e a precompilare tutti i campi.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventoClinicoForm } from "@/components/animali/evento-clinico-form";

export default async function ModificaEventoClinicoPage({
  params,
}: {
  params: Promise<{ id: string; eventoId: string }>;
}) {
  const { id, eventoId } = await params;
  const animaleId = Number(id);
  const eventoIdNum = Number(eventoId);
  if (Number.isNaN(animaleId) || Number.isNaN(eventoIdNum)) {
    notFound();
  }

  const animale = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!animale) {
    notFound();
  }

  const evento = await prisma.eventoClinico.findUnique({ where: { id: eventoIdNum } });
  // Non basta che l'evento esista: deve appartenere all'animale del path,
  // stessa verifica già applicata nelle rotte API PATCH/DELETE.
  if (!evento || evento.animaleId !== animaleId) {
    notFound();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4 py-10">
      <EventoClinicoForm
        animaleId={animale.id}
        nomeAnimale={animale.nome}
        eventoIniziale={evento}
      />
    </div>
  );
}
