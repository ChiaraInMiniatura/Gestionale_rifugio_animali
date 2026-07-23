import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnimaleForm } from "@/components/animali/animale-form";

export default async function ModificaAnimalePage({
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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <AnimaleForm animaleIniziale={animale} />
    </div>
  );
}
