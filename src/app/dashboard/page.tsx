// Pagina protetta (vedi matcher in src/proxy.ts): raggiungibile da
// qualunque utente loggato e approvato, senza distinzione di ruolo.
// Oltre al saluto, mostra "Farmaci di oggi": le terapie giornaliere
// attive nella giornata corrente, su tutti gli animali del rifugio.

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { terapiaAttivaOggi } from "@/lib/scadenza";
import { InstallaAppButton } from "@/components/installa-app-button";

export default async function DashboardPage() {
  // Il proxy ha già verificato sessione/approvazione a monte; qui si
  // rilegge la sessione solo per mostrare nome e ruolo, non per
  // riautorizzare l'accesso.
  const session = await getServerSession(authOptions);

  // Tutte le terapie giornaliere, poi filtrate in JS con terapiaAttivaOggi:
  // il confronto a livello di giorno di calendario (non solo >=/<= diretto
  // sulle Date) non è esprimibile comodamente nella where di Prisma.
  const terapieGiornaliere = await prisma.eventoClinico.findMany({
    where: { ricorrenza: "GIORNALIERA" },
    include: { animale: { select: { id: true, nome: true } } },
    orderBy: { animale: { nome: "asc" } },
  });
  const farmaciOggi = terapieGiornaliere.filter((evento) => terapiaAttivaOggi(evento));

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-teal-100 px-4 py-10 dark:bg-[#04120f]">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Benvenuta/o, <span className="capitalize">{session?.user.name}</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Ruolo: {session?.user.role}
        </p>
      </div>

      <InstallaAppButton />

      <div className="w-full max-w-lg">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Farmaci di oggi
        </h2>

        {farmaciOggi.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nessuna terapia giornaliera attiva oggi.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {farmaciOggi.map((evento) => (
              <li key={evento.id}>
                <Link
                  href={`/animali/${evento.animale.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                >
                  <span className="font-medium capitalize text-zinc-900 dark:text-zinc-50">
                    {evento.animale.nome}
                  </span>
                  <span className="text-sm capitalize text-zinc-600 dark:text-zinc-400">
                    {evento.nomeSpecifico}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
