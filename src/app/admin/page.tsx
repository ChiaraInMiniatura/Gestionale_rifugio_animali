// Pannello ADMIN-only: gestione completa degli utenti (VOLONTARIA e
// ADMIN), divisi in "in attesa di approvazione" e "confermati", con
// possibilità di eliminare, cambiare ruolo e password anche per queste
// ultime. Il controllo ruolo qui è un secondo livello di difesa (oltre al
// proxy, che già blocca i non-ADMIN su /admin): una pagina server
// component non deve fidarsi solo del middleware a monte.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UtentiList } from "@/components/admin/utenti-list";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="flex flex-1 items-center justify-center bg-teal-50 px-4 dark:bg-[#04120f]">
        <p className="text-zinc-700 dark:text-zinc-300">Accesso non consentito.</p>
      </div>
    );
  }

  // Nessun filtro di ruolo: VOLONTARIA e ADMIN compaiono entrambe, con il
  // ruolo mostrato esplicitamente (vedi mod/MOD9c.md per il perché).
  const utenti = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      approved: true,
      cellulare: true,
      note: true,
    },
  });

  // Date e null non serializzabili/scomodi come props a un client
  // component: normalizzati qui prima di passarli giù.
  const serializzati = utenti.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    cellulare: u.cellulare ?? "",
    note: u.note ?? "",
  }));

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-teal-50 px-4 py-10 dark:bg-[#04120f]">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Amministrazione utenti
      </h1>

      <UtentiList
        inAttesa={serializzati.filter((u) => !u.approved)}
        confermati={serializzati.filter((u) => u.approved)}
        // Serve alla UI per nascondere Elimina/Cambia ruolo sulla propria
        // riga: la vera guardia è comunque lato server in ogni rotta.
        idUtenteCorrente={Number(session.user.id)}
      />
    </div>
  );
}
