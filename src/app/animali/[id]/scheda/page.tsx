// Scheda clinica stampabile/scaricabile di un animale: dati anagrafici di
// base + cartella clinica, pensata per essere consegnata a un veterinario
// o a un nuovo affidatario/adottante, o tenuta come copia prima di
// eliminare l'animale. Deliberatamente senza classi "dark:": questa
// pagina resta sempre chiara (sfondo bianco, testo scuro) a prescindere
// dal tema del browser, così la stampa/il PDF risultano leggibili senza
// bisogno di CSS di stampa che neutralizzi il tema scuro caso per caso.
// Non include lo storico affidi/adozioni: contiene dati sensibili di
// persone terze (documento, cellulare) senza senso da consegnare a chi
// riceve questo documento.

import { notFound } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getSessioneApprovata } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { calcolaEta } from "@/lib/eta";
import { calcolaStatoEvento, coloreScadenza } from "@/lib/scadenza";
import { TIPO_EVENTO_LABEL } from "@/lib/evento-clinico-label";
import { StampaSchedaButton } from "@/components/animali/stampa-scheda-button";

export default async function SchedaClinicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Stesso livello di accesso già esistente per la cartella clinica:
  // chiunque loggato e approvato, nessuna restrizione aggiuntiva di ruolo.
  const session = await getSessioneApprovata();
  if (!session) {
    notFound();
  }

  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    notFound();
  }

  const animale = await prisma.animale.findUnique({
    where: { id: animaleId },
    include: { eventiClinici: { orderBy: { data: "desc" } } },
  });
  if (!animale) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-white px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold capitalize text-zinc-900">
            Scheda clinica — {animale.nome}
          </h1>
          <StampaSchedaButton />
        </div>

        <p className="mb-6 text-xs text-zinc-600">
          Generata il {format(new Date(), "d MMMM yyyy", { locale: it })}
        </p>

        <dl className="mb-6 space-y-2 text-sm text-zinc-700">
          <div>
            <dt className="font-medium text-zinc-900">Specie</dt>
            <dd className="capitalize">{animale.specie.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Razza</dt>
            <dd>{animale.razza ?? "Non nota"}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Sesso</dt>
            <dd>
              {animale.sesso === "MASCHIO"
                ? "Maschio"
                : animale.sesso === "FEMMINA"
                  ? "Femmina"
                  : "Non noto"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Sterilizzato</dt>
            <dd>
              {animale.sterilizzato === true
                ? "Sì"
                : animale.sterilizzato === false
                  ? "No"
                  : "Non specificato"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Età</dt>
            <dd>{calcolaEta(animale.dataNascita) ?? "Non nota"}</dd>
          </div>
          {animale.descrizione && (
            <div>
              <dt className="font-medium text-zinc-900">Descrizione</dt>
              <dd>{animale.descrizione}</dd>
            </div>
          )}
          {animale.note && (
            <div>
              <dt className="font-medium text-zinc-900">Note</dt>
              <dd>{animale.note}</dd>
            </div>
          )}
        </dl>

        <div className="border-t border-zinc-200 pt-4">
          <p className="mb-3 text-sm font-medium text-zinc-900">Cartella clinica</p>

          {animale.eventiClinici.length === 0 ? (
            <p className="text-sm text-zinc-700">Nessun evento clinico registrato.</p>
          ) : (
            <ul className="space-y-3">
              {animale.eventiClinici.map((evento) => {
                const { stato, campo } =
                  evento.ricorrenza !== "GIORNALIERA"
                    ? calcolaStatoEvento(evento)
                    : { stato: null, campo: null };

                return (
                  <li
                    key={evento.id}
                    className="rounded-md border border-zinc-200 p-3 text-sm"
                  >
                    <p className="font-medium text-zinc-900">
                      {TIPO_EVENTO_LABEL[evento.tipo]} —{" "}
                      <span className="capitalize">{evento.nomeSpecifico}</span>
                    </p>

                    {evento.ricorrenza === "GIORNALIERA" ? (
                      <p className="text-zinc-700">
                        {format(evento.data, "d MMMM yyyy", { locale: it })} →{" "}
                        {evento.dataFine
                          ? format(evento.dataFine, "d MMMM yyyy", { locale: it })
                          : "in corso"}
                      </p>
                    ) : (
                      <>
                        <p className={campo === "data" ? coloreScadenza(stato) : "text-zinc-700"}>
                          {format(evento.data, "d MMMM yyyy, HH:mm", { locale: it })}
                        </p>
                        {evento.dataScadenza && (
                          <p
                            className={
                              campo === "dataScadenza" ? coloreScadenza(stato) : "text-zinc-700"
                            }
                          >
                            Prossimo richiamo:{" "}
                            {format(evento.dataScadenza, "d MMMM yyyy, HH:mm", { locale: it })}
                          </p>
                        )}
                      </>
                    )}

                    {evento.note && <p className="mt-1 text-zinc-700">{evento.note}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
