// Pagina di creazione evento clinico: wrapper sottile attorno a
// EventoClinicoForm, chiamato senza eventoIniziale così il form sa di
// essere in modalità "nuovo" (POST invece di PATCH).

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventoClinicoForm } from "@/components/animali/evento-clinico-form";

export default async function NuovoEventoClinicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    notFound();
  }

  const animale = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!animale) {
    notFound();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-teal-50 px-4 py-10 dark:bg-[#04120f]">
      <EventoClinicoForm animaleId={animale.id} nomeAnimale={animale.nome} />
    </div>
  );
}
