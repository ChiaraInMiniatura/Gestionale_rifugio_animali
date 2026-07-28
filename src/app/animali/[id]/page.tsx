// Dettaglio di un animale: unica pagina che mostra la foto (grande, in
// fondo), la cartella clinica (eventi + scadenze), lo storico affidi/
// adozioni e i controlli riservati agli ADMIN (cambio stato, eliminazione).
// Fallback testuale esplicito per ogni campo opzionale, così l'assenza di
// un dato è sempre comunicata, mai lasciata come spazio vuoto.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcolaEta } from "@/lib/eta";
import { calcolaStatoEvento, coloreScadenza } from "@/lib/scadenza";
import { STATO_LABEL } from "@/lib/stato-animale";
import { TIPO_EVENTO_LABEL } from "@/lib/evento-clinico-label";
import { TIPO_RAPPORTO_LABEL } from "@/lib/tipo-rapporto-label";
import { StatoControl } from "@/components/animali/stato-control";
import { EliminaAnimaleButton } from "@/components/animali/elimina-animale-button";
import { EliminaEventoButton } from "@/components/animali/elimina-evento-button";
import { ConfermaEventoButton } from "@/components/animali/conferma-evento-button";

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

  // Sessione e animale (con cartella clinica e storico affidi/adozioni,
  // più recenti prima) recuperati in parallelo: sono indipendenti, non
  // c'è motivo di attendere l'uno prima di iniziare l'altro.
  const [session, animale] = await Promise.all([
    getServerSession(authOptions),
    prisma.animale.findUnique({
      where: { id: animaleId },
      include: {
        eventiClinici: {
          orderBy: { data: "desc" },
          include: { storico: { orderBy: { modificatoIl: "desc" } } },
        },
        adozioni: { orderBy: { dataInizio: "desc" } },
      },
    }),
  ]);

  if (!animale) {
    notFound();
  }

  const isAdmin = session?.user.role === "ADMIN";
  // Il rapporto ancora in corso (se c'è): precompila i campi persona in
  // StatoControl quando si passa da IN_AFFIDO ad ADOTTATO sullo stesso
  // rapporto, invece di richiederli di nuovo da zero.
  const adozioneAperta = animale.adozioni.find((a) => a.dataFine === null) ?? null;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-teal-50 px-4 py-10 dark:bg-[#04120f]">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold capitalize text-zinc-900 dark:text-zinc-50">
            {animale.nome}
          </h1>
          <Link
            href={`/animali/${animale.id}/modifica`}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
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
            <dt className="font-medium text-zinc-900 dark:text-zinc-50">Sesso</dt>
            <dd>
              {/* animale.sesso è opzionale (null = non noto): nessun
                  terzo valore nell'enum, la mancanza è gestita qui. */}
              {animale.sesso === "MASCHIO"
                ? "Maschio"
                : animale.sesso === "FEMMINA"
                  ? "Femmina"
                  : "Non noto"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900 dark:text-zinc-50">Sterilizzato</dt>
            <dd>
              {/* Booleano nullable: tre stati distinti (Sì/No/Non
                  specificato), non un semplice truthy check. */}
              {animale.sterilizzato === true
                ? "Sì"
                : animale.sterilizzato === false
                  ? "No"
                  : "Non specificato"}
            </dd>
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
            // Solo l'ADMIN vede il controllo interattivo (select + Salva);
            // le altre volontarie vedono lo stato in sola lettura.
            <StatoControl
              animaleId={animale.id}
              statoAttuale={animale.stato}
              adozioneAperta={
                adozioneAperta && {
                  nome: adozioneAperta.nome,
                  cognome: adozioneAperta.cognome,
                  cellulare: adozioneAperta.cellulare,
                  documento: adozioneAperta.documento,
                  note: adozioneAperta.note ?? "",
                }
              }
            />
          ) : (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {STATO_LABEL[animale.stato]}
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Cartella clinica
            </p>
            <Link
              href={`/animali/${animale.id}/eventi/nuovo`}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
            >
              Aggiungi evento
            </Link>
          </div>

          {animale.eventiClinici.length === 0 ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Nessun evento clinico registrato.
            </p>
          ) : (
            <ul className="space-y-3">
              {animale.eventiClinici.map((evento) => {
                // La scadenza si applica a NESSUNA/MENSILE/ANNUALE (tutto
                // tranne le terapie giornaliere, dove dataScadenza resta
                // sempre null). "campo" dice quale riga (data vs
                // dataScadenza) va colorata: non è sempre la stessa,
                // dipende da come calcolaStatoEvento ha determinato lo
                // stato per questo evento specifico.
                const { stato, campo } =
                  evento.ricorrenza !== "GIORNALIERA"
                    ? calcolaStatoEvento(evento)
                    : { stato: null, campo: null };

                return (
                  <li
                    key={evento.id}
                    className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {TIPO_EVENTO_LABEL[evento.tipo]} — <span className="capitalize">{evento.nomeSpecifico}</span>
                        </p>

                        {evento.ricorrenza === "GIORNALIERA" ? (
                          // Terapia continuativa: periodo, non un singolo
                          // istante. L'orario di "data" è ignorato in UI
                          // (vedi commento su EventoClinico in schema.prisma).
                          <p className="text-zinc-700 dark:text-zinc-300">
                            {format(evento.data, "d MMMM yyyy", { locale: it })} →{" "}
                            {evento.dataFine
                              ? format(evento.dataFine, "d MMMM yyyy", { locale: it })
                              : "in corso"}
                          </p>
                        ) : (
                          <>
                            <p
                              className={
                                campo === "data"
                                  ? coloreScadenza(stato)
                                  : "text-zinc-700 dark:text-zinc-300"
                              }
                            >
                              {format(evento.data, "d MMMM yyyy, HH:mm", { locale: it })}
                            </p>
                            {evento.dataScadenza && (
                              <p
                                className={
                                  campo === "dataScadenza"
                                    ? coloreScadenza(stato)
                                    : "text-zinc-700 dark:text-zinc-300"
                                }
                              >
                                Prossimo richiamo:{" "}
                                {format(evento.dataScadenza, "d MMMM yyyy, HH:mm", { locale: it })}
                              </p>
                            )}
                          </>
                        )}

                        {evento.note && (
                          <p className="mt-1 text-zinc-700 dark:text-zinc-300">{evento.note}</p>
                        )}

                        {/* Nessun link se l'evento non è mai stato modificato
                            (il caso più comune): niente rumore visivo per chi
                            non ne ha bisogno. Sola consultazione, nessun
                            controllo interattivo su queste righe. */}
                        {evento.storico.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-zinc-700 underline dark:text-zinc-300">
                              Storico modifiche ({evento.storico.length})
                            </summary>
                            <ul className="mt-2 space-y-2">
                              {evento.storico.map((versione) => (
                                <li
                                  key={versione.id}
                                  className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
                                >
                                  <p className="text-zinc-900 dark:text-zinc-50">
                                    {TIPO_EVENTO_LABEL[versione.tipo]} —{" "}
                                    <span className="capitalize">{versione.nomeSpecifico}</span>
                                  </p>
                                  <p className="text-zinc-700 dark:text-zinc-300">
                                    {versione.ricorrenza === "GIORNALIERA"
                                      ? `${format(versione.data, "d MMMM yyyy", { locale: it })} → ${
                                          versione.dataFine
                                            ? format(versione.dataFine, "d MMMM yyyy", { locale: it })
                                            : "in corso"
                                        }`
                                      : format(versione.data, "d MMMM yyyy, HH:mm", { locale: it })}
                                  </p>
                                  {versione.dataScadenza && (
                                    <p className="text-zinc-700 dark:text-zinc-300">
                                      Prossimo richiamo:{" "}
                                      {format(versione.dataScadenza, "d MMMM yyyy, HH:mm", { locale: it })}
                                    </p>
                                  )}
                                  {versione.note && (
                                    <p className="text-zinc-700 dark:text-zinc-300">{versione.note}</p>
                                  )}
                                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                    Modificato il{" "}
                                    {format(versione.modificatoIl, "d MMMM yyyy, HH:mm", { locale: it })}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Link
                          href={`/animali/${animale.id}/eventi/${evento.id}/modifica`}
                          className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                        >
                          Modifica
                        </Link>
                        {/* Il concetto di conferma esiste per NESSUNA/
                            MENSILE/ANNUALE (vedi ConfermaEventoButton e
                            calcolaStatoEvento), mai per GIORNALIERA: una
                            terapia continuativa non ha un "appuntamento"
                            da confermare. */}
                        {evento.ricorrenza !== "GIORNALIERA" && (
                          <ConfermaEventoButton
                            animaleId={animale.id}
                            eventoId={evento.id}
                            confermato={evento.confermato}
                          />
                        )}
                        <EliminaEventoButton
                          animaleId={animale.id}
                          eventoId={evento.id}
                          tipo={evento.tipo}
                          nomeSpecifico={evento.nomeSpecifico}
                          data={evento.data}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Storico affidi/adozioni
          </p>

          {animale.adozioni.length === 0 ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Nessun affido o adozione registrati.
            </p>
          ) : (
            <ul className="space-y-3">
              {animale.adozioni.map((adozione) => (
                <li
                  key={adozione.id}
                  className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {TIPO_RAPPORTO_LABEL[adozione.tipo]} —{" "}
                    <span className="capitalize">
                      {adozione.nome} {adozione.cognome}
                    </span>
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {format(adozione.dataInizio, "d MMMM yyyy", { locale: it })} →{" "}
                    {adozione.dataFine
                      ? format(adozione.dataFine, "d MMMM yyyy", { locale: it })
                      : "in corso"}
                  </p>
                  {/* Cellulare e documento: dato sensibile, visibile solo
                      all'ADMIN, mai alla VOLONTARIA (creazione/modifica
                      già ADMIN-only tramite StatoControl). */}
                  {isAdmin && (
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {adozione.cellulare} · {adozione.documento}
                    </p>
                  )}
                  {adozione.note && (
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{adozione.note}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isAdmin && (
          <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <EliminaAnimaleButton
              animaleId={animale.id}
              nome={animale.nome}
              haEventiClinici={animale.eventiClinici.length > 0}
              haAdozioni={animale.adozioni.length > 0}
            />
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
            <div className="flex min-h-[50vh] w-full items-center justify-center rounded-md bg-zinc-100 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Nessuna foto disponibile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
