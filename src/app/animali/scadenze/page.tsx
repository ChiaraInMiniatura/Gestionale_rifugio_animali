// Vista aggregata delle scadenze su tutto il rifugio (/animali/scadenze):
// solo eventi non ricorrenti (vaccini, antiparassitari, visite — mai
// terapie giornaliere, che non hanno dataScadenza) scaduti o entro 14
// giorni, ordinati per urgenza, con link all'animale a cui appartengono.
// La data rilevante non è sempre dataScadenza: calcolaStatoEvento sceglie
// evento.data per gli appuntamenti "programmati in anticipo" ancora da
// avvenire (vedi src/lib/scadenza.ts), altrimenti resta dataScadenza.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcolaStatoEvento, coloreScadenza } from "@/lib/scadenza";
import { TIPO_EVENTO_LABEL } from "@/lib/evento-clinico-label";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Stesso motivo di /animali/page.tsx: nessuna API dinamica di Next viene
// chiamata qui, quindi senza questa direttiva la pagina verrebbe
// pre-renderizzata staticamente e le scadenze non si aggiornerebbero.
export const dynamic = "force-dynamic";

export default async function ScadenzePage() {
  // Non più filtrato su dataScadenza: not null a livello di query — un
  // appuntamento futuro senza dataScadenza (caso tipico corretto da
  // calcolaStatoEvento) andrebbe perso qui altrimenti. Il filtro vero e
  // proprio (scaduto/in scadenza) è più sotto, dopo aver scelto la data
  // rilevante per ciascun evento.
  const eventi = await prisma.eventoClinico.findMany({
    where: { ricorrenza: "NESSUNA" },
    include: { animale: { select: { id: true, nome: true } } },
  });

  // calcolaStatoEvento decide, evento per evento, se la data rilevante è
  // "data" (appuntamento non ancora avvenuto, programmato in anticipo) o
  // "dataScadenza" (richiamo di un evento già registrato): l'ordinamento
  // per urgenza va quindi fatto qui in JS su quella data, non più a
  // livello di query Prisma (che non può saperlo in anticipo).
  const scadenze = eventi
    .map((evento) => {
      const { stato, campo } = calcolaStatoEvento(evento);
      const dataRilevante = campo === "data" ? evento.data : evento.dataScadenza;
      return { evento, stato, dataRilevante };
    })
    .filter((e) => e.stato !== null)
    .sort((a, b) => a.dataRilevante!.getTime() - b.dataRilevante!.getTime());

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Scadenze
        </h1>

        {scadenze.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nessuna scadenza imminente o passata.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {scadenze.map(({ evento, stato, dataRilevante }) => (
              <li key={evento.id}>
                <Link
                  href={`/animali/${evento.animale.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {evento.animale.nome} — {TIPO_EVENTO_LABEL[evento.tipo]}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {evento.nomeSpecifico}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${coloreScadenza(stato)}`}>
                    {format(dataRilevante!, "d MMMM yyyy, HH:mm", { locale: it })}
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
