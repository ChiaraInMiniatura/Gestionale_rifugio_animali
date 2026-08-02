// Pagina protetta (vedi matcher in src/proxy.ts): raggiungibile da
// qualunque utente loggato e approvato, senza distinzione di ruolo.
// Oltre al saluto, mostra "Farmaci di oggi": le terapie giornaliere
// attive nella giornata corrente, su tutti gli animali del rifugio.

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { terapiaAttivaOggi } from "@/lib/scadenza";

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
    <div className="flex flex-1 flex-col items-center gap-8 bg-page px-4 py-10">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-ink">
          Benvenuta/o, <span className="capitalize">{session?.user.name}</span>
        </h1>
        <p className="mt-2 inline-block rounded-full bg-positive-soft px-3 py-1 text-sm font-medium text-positive">
          {session?.user.role}
        </p>
      </div>

      <div className="w-full max-w-lg">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Farmaci di oggi
        </h2>

        {farmaciOggi.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Nessuna terapia giornaliera attiva oggi.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            {farmaciOggi.map((evento) => (
              <li key={evento.id}>
                <Link
                  href={`/animali/${evento.animale.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-page active:bg-accent-soft"
                >
                  <span className="font-medium capitalize text-ink">
                    {evento.animale.nome}
                  </span>
                  <span className="text-sm capitalize text-ink-soft">
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
