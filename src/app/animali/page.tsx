// Elenco animali (/animali): aperta a chiunque loggato e approvato (il
// controllo vero e proprio è nel proxy). Mostra solo i campi essenziali
// per una lista leggera: niente foto, sesso o sterilizzato qui, riservati
// al dettaglio del singolo animale. Include un filtro di ricerca (nome,
// razza, stato, specie) tramite query string: un semplice form GET, senza
// JavaScript, che ricarica la pagina con i filtri applicati.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcolaEta } from "@/lib/eta";
import { STATO_LABEL } from "@/lib/stato-animale";
import { parseRicercaAnimali } from "@/lib/validations/ricerca-animali";

// Nessuna API dinamica di Next viene chiamata qui (a differenza di
// dashboard/admin, che lo diventano di riflesso tramite getServerSession),
// quindi senza questa direttiva Next pre-renderizza la pagina staticamente
// in build: gli animali creati/modificati/eliminati dopo non comparirebbero
// più finché non si ricompila.
export const dynamic = "force-dynamic";

export default async function AnimaliPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stato?: string; specie?: string }>;
}) {
  const filtri = parseRicercaAnimali(await searchParams);
  // Distingue "database vuoto" da "nessun risultato per questi filtri":
  // due messaggi diversi più sotto, non basta guardare la sola lunghezza
  // dell'elenco.
  const filtriAttivi = Boolean(filtri.q || filtri.stato || filtri.specie);

  const animali = await prisma.animale.findMany({
    where: {
      // OR solo tra nome/razza (corrispondenza testuale); AND con gli
      // altri filtri sotto, ciascuno indipendente dagli altri.
      ...(filtri.q
        ? {
            OR: [
              { nome: { contains: filtri.q, mode: "insensitive" as const } },
              { razza: { contains: filtri.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(filtri.stato ? { stato: filtri.stato } : {}),
      ...(filtri.specie ? { specie: filtri.specie } : {}),
    },
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
    <div className="flex flex-1 flex-col items-center gap-6 bg-teal-50 px-4 py-10 dark:bg-[#04120f]">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Animali
        </h1>
        <Link
          href="/animali/nuovo"
          className="inline-block rounded-full bg-teal-700 px-4 py-1.5 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700"
        >
          Nuovo animale
        </Link>
      </div>

      {/* Form GET nativo (niente client component/fetch): il submit del
          browser ricarica /animali con i filtri in query string, quindi
          funziona anche senza JavaScript ed è condivisibile/bookmarkabile. */}
      <form
        method="GET"
        action="/animali"
        className="flex w-full max-w-3xl flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="min-w-[180px] flex-1">
          <label
            htmlFor="q"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Cerca per nome o razza
          </label>
          <input
            id="q"
            type="text"
            name="q"
            defaultValue={filtri.q ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label
            htmlFor="stato"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Stato
          </label>
          <select
            id="stato"
            name="stato"
            defaultValue={filtri.stato ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Tutti gli stati</option>
            <option value="DISPONIBILE">{STATO_LABEL.DISPONIBILE}</option>
            <option value="IN_AFFIDO">{STATO_LABEL.IN_AFFIDO}</option>
            <option value="ADOTTATO">{STATO_LABEL.ADOTTATO}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="specie"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Specie
          </label>
          <select
            id="specie"
            name="specie"
            defaultValue={filtri.specie ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Tutte le specie</option>
            <option value="CANE">Cane</option>
            <option value="GATTO">Gatto</option>
            <option value="ALTRO">Altro</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700"
        >
          Cerca
        </button>

        {filtriAttivi && (
          <Link
            href="/animali"
            className="inline-block text-sm font-medium text-zinc-700 underline transition hover:scale-105 active:scale-95 dark:text-zinc-300"
          >
            Azzera filtri
          </Link>
        )}
      </form>

      {animali.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtriAttivi
            ? "Nessun animale corrisponde ai filtri di ricerca."
            : "Nessun animale registrato."}
        </p>
      ) : (
        <ul className="w-full max-w-3xl divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {animali.map((animale) => (
            <li key={animale.id}>
              <Link
                href={`/animali/${animale.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
              >
                <div>
                  <p className="font-medium capitalize text-zinc-900 dark:text-zinc-50">
                    {animale.nome}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {animale.razza ?? "Razza non nota"} ·{" "}
                    {calcolaEta(animale.dataNascita) ?? "età non nota"}
                  </p>
                </div>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
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
