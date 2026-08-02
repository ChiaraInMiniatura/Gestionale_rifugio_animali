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
    <div className="flex flex-1 flex-col items-center gap-6 bg-page px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold capitalize text-ink">
            {animale.nome}
          </h1>
          <Link
            href={`/animali/${animale.id}/modifica`}
            className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:scale-105 hover:bg-page active:scale-95 active:bg-accent-soft"
          >
            Modifica dati
          </Link>
        </div>

        <dl className="mt-4 space-y-3 text-sm text-ink-soft">
          <div>
            <dt className="font-medium text-ink">Razza</dt>
            <dd>{animale.razza ?? "Non nota"}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">N° microchip</dt>
            <dd>{animale.microchip ?? "Non registrato"}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Sesso</dt>
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
            <dt className="font-medium text-ink">Sterilizzato</dt>
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
            <dt className="font-medium text-ink">Età</dt>
            <dd>{calcolaEta(animale.dataNascita) ?? "Non nota"}</dd>
          </div>
          {animale.descrizione && (
            <div>
              <dt className="font-medium text-ink">Descrizione</dt>
              <dd>{animale.descrizione}</dd>
            </div>
          )}
          {animale.note && (
            <div>
              <dt className="font-medium text-ink">Note</dt>
              <dd>{animale.note}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium text-ink">Stato</p>
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
            <p className="text-sm text-ink-soft">
              {STATO_LABEL[animale.stato]}
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-ink">
              Cartella clinica
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/animali/${animale.id}/scheda`}
                className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:scale-105 hover:bg-page active:scale-95 active:bg-accent-soft"
              >
                Scarica scheda clinica
              </Link>
              <Link
                href={`/animali/${animale.id}/eventi/nuovo`}
                className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:scale-105 hover:bg-page active:scale-95 active:bg-accent-soft"
              >
                Aggiungi evento
              </Link>
            </div>
          </div>

          {animale.eventiClinici.length === 0 ? (
            <p className="text-sm text-ink-soft">
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
                    className="rounded-xl border border-line bg-surface p-3 text-sm shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-ink">
                          {TIPO_EVENTO_LABEL[evento.tipo]} — <span className="capitalize">{evento.nomeSpecifico}</span>
                        </p>

                        {evento.ricorrenza === "GIORNALIERA" ? (
                          // Terapia continuativa: periodo, non un singolo
                          // istante. L'orario di "data" è ignorato in UI
                          // (vedi commento su EventoClinico in schema.prisma).
                          <p className="text-ink-soft">
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
                                  : "text-ink-soft"
                              }
                            >
                              {format(evento.data, "d MMMM yyyy, HH:mm", { locale: it })}
                            </p>
                            {evento.dataScadenza && (
                              <p
                                className={
                                  campo === "dataScadenza"
                                    ? coloreScadenza(stato)
                                    : "text-ink-soft"
                                }
                              >
                                Prossimo richiamo:{" "}
                                {format(evento.dataScadenza, "d MMMM yyyy, HH:mm", { locale: it })}
                              </p>
                            )}
                          </>
                        )}

                        {evento.note && (
                          <p className="mt-1 text-ink-soft">{evento.note}</p>
                        )}

                        {/* Nessun link se l'evento non è mai stato modificato
                            (il caso più comune): niente rumore visivo per chi
                            non ne ha bisogno. Sola consultazione, nessun
                            controllo interattivo su queste righe. */}
                        {evento.storico.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-ink-soft underline">
                              Storico modifiche ({evento.storico.length})
                            </summary>
                            <ul className="mt-2 space-y-2">
                              {evento.storico.map((versione) => (
                                <li
                                  key={versione.id}
                                  className="rounded-xl border border-line p-2"
                                >
                                  <p className="text-ink">
                                    {TIPO_EVENTO_LABEL[versione.tipo]} —{" "}
                                    <span className="capitalize">{versione.nomeSpecifico}</span>
                                  </p>
                                  <p className="text-ink-soft">
                                    {versione.ricorrenza === "GIORNALIERA"
                                      ? `${format(versione.data, "d MMMM yyyy", { locale: it })} → ${
                                          versione.dataFine
                                            ? format(versione.dataFine, "d MMMM yyyy", { locale: it })
                                            : "in corso"
                                        }`
                                      : format(versione.data, "d MMMM yyyy, HH:mm", { locale: it })}
                                  </p>
                                  {versione.dataScadenza && (
                                    <p className="text-ink-soft">
                                      Prossimo richiamo:{" "}
                                      {format(versione.dataScadenza, "d MMMM yyyy, HH:mm", { locale: it })}
                                    </p>
                                  )}
                                  {versione.note && (
                                    <p className="text-ink-soft">{versione.note}</p>
                                  )}
                                  <p className="mt-1 text-xs text-ink-soft">
                                    Modificato il{" "}
                                    {format(versione.modificatoIl, "d MMMM yyyy, HH:mm", { locale: it })}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-col sm:items-end">
                        <Link
                          href={`/animali/${animale.id}/eventi/${evento.id}/modifica`}
                          className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:scale-105 hover:bg-page active:scale-95 active:bg-accent-soft"
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

        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-3 text-sm font-medium text-ink">
            Storico affidi/adozioni
          </p>

          {animale.adozioni.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Nessun affido o adozione registrati.
            </p>
          ) : (
            <ul className="space-y-3">
              {animale.adozioni.map((adozione) => (
                <li
                  key={adozione.id}
                  className="rounded-xl border border-line bg-surface p-3 text-sm shadow-sm"
                >
                  <p className="font-medium text-ink">
                    {TIPO_RAPPORTO_LABEL[adozione.tipo]} —{" "}
                    <span className="capitalize">
                      {adozione.nome} {adozione.cognome}
                    </span>
                  </p>
                  <p className="text-ink-soft">
                    {format(adozione.dataInizio, "d MMMM yyyy", { locale: it })} →{" "}
                    {adozione.dataFine
                      ? format(adozione.dataFine, "d MMMM yyyy", { locale: it })
                      : "in corso"}
                  </p>
                  {/* Cellulare e documento: dato sensibile, visibile solo
                      all'ADMIN, mai alla VOLONTARIA (creazione/modifica
                      già ADMIN-only tramite StatoControl). */}
                  {isAdmin && (
                    <p className="text-ink-soft">
                      {adozione.cellulare} · {adozione.documento}
                    </p>
                  )}
                  {adozione.note && (
                    <p className="mt-1 text-ink-soft">{adozione.note}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isAdmin && (
          <div className="mt-6 border-t border-line pt-4">
            <EliminaAnimaleButton
              animaleId={animale.id}
              nome={animale.nome}
              haEventiClinici={animale.eventiClinici.length > 0}
              haAdozioni={animale.adozioni.length > 0}
            />
          </div>
        )}

        <div className="mt-6 border-t border-line pt-4">
          {animale.foto ? (
            <img
              src={animale.foto}
              alt={animale.nome}
              className="min-h-[50vh] w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex min-h-[50vh] w-full items-center justify-center rounded-md bg-surface text-sm text-ink-soft">
              Nessuna foto disponibile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
