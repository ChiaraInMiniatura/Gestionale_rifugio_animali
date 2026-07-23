import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcolaEta } from "@/lib/eta";
import { STATO_LABEL } from "@/lib/stato-animale";

// Nessuna API dinamica di Next viene chiamata qui (a differenza di
// dashboard/admin, che lo diventano di riflesso tramite getServerSession),
// quindi senza questa direttiva Next pre-renderizza la pagina staticamente
// in build: gli animali creati/modificati/eliminati dopo non comparirebbero
// più finché non si ricompila.
export const dynamic = "force-dynamic";

export default async function AnimaliPage() {
  const animali = await prisma.animale.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      razza: true,
      dataNascita: true,
      stato: true,
    },
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Animali
        </h1>
        <Link
          href="/animali/nuovo"
          className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Nuovo animale
        </Link>
      </div>

      {animali.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nessun animale registrato.
        </p>
      ) : (
        <ul className="w-full max-w-3xl divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {animali.map((animale) => (
            <li key={animale.id}>
              <Link
                href={`/animali/${animale.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {animale.nome}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {animale.razza ?? "Razza non nota"} ·{" "}
                    {calcolaEta(animale.dataNascita) ?? "età non nota"}
                  </p>
                </div>
                <span className="text-sm text-zinc-500 dark:text-zinc-500">
                  {STATO_LABEL[animale.stato]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
