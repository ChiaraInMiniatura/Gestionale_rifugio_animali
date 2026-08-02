// Vista aggregata delle scadenze su tutto il rifugio (/animali/scadenze):
// due sezioni per gli eventi con un concetto di scadenza (singoli,
// richiami mensili/annuali — mai terapie giornaliere, che non ce l'hanno),
// in base alla data rilevante scelta da dataRilevanteEvento (src/lib/scadenza.ts):
// "Scadenze imminenti" (scadute o entro 14 giorni) e "Scadenze future"
// (oltre i 14 giorni), ciascun evento in una sola delle due, mai in entrambe.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcolaStatoScadenza, coloreScadenza, dataRilevanteEvento } from "@/lib/scadenza";
import { TIPO_EVENTO_LABEL } from "@/lib/evento-clinico-label";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Stesso motivo di /animali/page.tsx: nessuna API dinamica di Next viene
// chiamata qui, quindi senza questa direttiva la pagina verrebbe
// pre-renderizzata staticamente e le scadenze non si aggiornerebbero.
export const dynamic = "force-dynamic";

// Restringe T | null a T: filtra gli eventi senza una data rilevante
// (confermati e senza dataScadenza impostata) mantenendo il tipo pulito
// nelle due liste sotto, senza ripetere asserzioni non-null ovunque.
function nonNulla<T>(v: T | null): v is T {
  return v !== null;
}

export default async function ScadenzePage() {
  // Tutti gli eventi tranne le terapie giornaliere (le uniche senza un
  // concetto di scadenza): il campo confermato fa già parte del record
  // completo restituito da Prisma. Il filtro vero e proprio
  // (imminente/futura) è più sotto, dopo aver scelto la data rilevante
  // per ciascun evento.
  const eventi = await prisma.eventoClinico.findMany({
    where: { ricorrenza: { not: "GIORNALIERA" } },
    include: { animale: { select: { id: true, nome: true } } },
  });

  const risultati = eventi
    .map((evento) => {
      const rilevante = dataRilevanteEvento(evento);
      if (!rilevante) {
        return null;
      }
      return {
        evento,
        data: rilevante.data,
        // null qui significa solo "oltre 14 giorni nel futuro"
        // (calcolaStatoScadenza segnala "scaduto" qualunque data passata,
        // senza limite): è esattamente il confine tra le due sezioni sotto.
        stato: calcolaStatoScadenza(rilevante.data),
      };
    })
    .filter(nonNulla);

  const scadenzeImminenti = risultati
    .filter((r) => r.stato !== null)
    .sort((a, b) => a.data.getTime() - b.data.getTime());

  const scadenzeFuture = risultati
    .filter((r) => r.stato === null)
    .sort((a, b) => a.data.getTime() - b.data.getTime());

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-teal-100 px-4 py-10 dark:bg-[#04120f]">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Scadenze
        </h1>

        <h2 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Scadenze imminenti
        </h2>
        {scadenzeImminenti.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nessuna scadenza imminente o passata.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {scadenzeImminenti.map(({ evento, data, stato }) => (
              <li key={evento.id}>
                <Link
                  href={`/animali/${evento.animale.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      <span className="capitalize">{evento.animale.nome}</span> — {TIPO_EVENTO_LABEL[evento.tipo]}
                    </p>
                    <p className="text-sm capitalize text-zinc-600 dark:text-zinc-400">
                      {evento.nomeSpecifico}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${coloreScadenza(stato)}`}>
                    {format(data, "d MMMM yyyy, HH:mm", { locale: it })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Omessa del tutto se vuota (nessun titolo con "nessuna voce" sotto). */}
        {scadenzeFuture.length > 0 && (
          <>
            <h2 className="mb-3 mt-8 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Scadenze future
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {scadenzeFuture.map(({ evento, data, stato }) => (
                <li key={evento.id}>
                  <Link
                    href={`/animali/${evento.animale.id}`}
                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        <span className="capitalize">{evento.animale.nome}</span> — {TIPO_EVENTO_LABEL[evento.tipo]}
                      </p>
                      <p className="text-sm capitalize text-zinc-600 dark:text-zinc-400">
                        {evento.nomeSpecifico}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${coloreScadenza(stato)}`}>
                      {format(data, "d MMMM yyyy, HH:mm", { locale: it })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
