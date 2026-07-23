// Pannello ADMIN-only: elenco delle richieste di registrazione in attesa
// di approvazione. Il controllo ruolo qui è un secondo livello di difesa
// (oltre al proxy, che già blocca i non-ADMIN su /admin): una pagina
// server component non deve fidarsi solo del middleware a monte.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PendingUsers } from "@/components/admin/pending-users";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <p className="text-zinc-700 dark:text-zinc-300">Accesso non consentito.</p>
      </div>
    );
  }

  const pendingUsers = await prisma.user.findMany({
    where: { approved: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Richieste di registrazione in attesa
      </h1>

      <PendingUsers
        initialUsers={pendingUsers.map((u) => ({
          ...u,
          // Date non serializzabili come props a un client component:
          // vanno convertite in stringa ISO prima di passarle giù.
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
