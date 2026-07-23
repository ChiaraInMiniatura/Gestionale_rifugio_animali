import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcolaEta } from "@/lib/eta";
import { STATO_LABEL } from "@/lib/stato-animale";
import { StatoControl } from "@/components/animali/stato-control";
import { EliminaAnimaleButton } from "@/components/animali/elimina-animale-button";

export default async function AnimaleDettaglioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    notFound();
  }

  const [session, animale] = await Promise.all([
    getServerSession(authOptions),
    prisma.animale.findUnique({ where: { id: animaleId } }),
  ]);

  if (!animale) {
    notFound();
  }

  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {animale.nome}
          </h1>
          <Link
            href={`/animali/${animale.id}/modifica`}
            className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
          >
            Modifica dati
          </Link>
        </div>

        <dl className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <div>
            <dt className="font-medium text-zinc-900 dark:text-zinc-50">Razza</dt>
            <dd>{animale.razza ?? "Non nota"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900 dark:text-zinc-50">Età</dt>
            <dd>{calcolaEta(animale.dataNascita) ?? "Non nota"}</dd>
          </div>
          {animale.descrizione && (
            <div>
              <dt className="font-medium text-zinc-900 dark:text-zinc-50">Descrizione</dt>
              <dd>{animale.descrizione}</dd>
            </div>
          )}
          {animale.note && (
            <div>
              <dt className="font-medium text-zinc-900 dark:text-zinc-50">Note</dt>
              <dd>{animale.note}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">Stato</p>
          {isAdmin ? (
            <StatoControl animaleId={animale.id} statoAttuale={animale.stato} />
          ) : (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {STATO_LABEL[animale.stato]}
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <EliminaAnimaleButton animaleId={animale.id} nome={animale.nome} />
          </div>
        )}

        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {animale.foto ? (
            <img
              src={animale.foto}
              alt={animale.nome}
              className="min-h-[50vh] w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex min-h-[50vh] w-full items-center justify-center rounded-md bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
              Nessuna foto disponibile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
