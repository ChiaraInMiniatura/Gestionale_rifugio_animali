// Link di navigazione nell'header: visibili solo se c'è una sessione, e
// il link "Amministrazione" solo per il ruolo ADMIN. Questo filtro è solo
// estetico (nasconde link non pertinenti): l'accesso reale alle pagine è
// comunque riverificato dal proxy e dalle pagine stesse.

"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function NavLinks() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <nav className="flex items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      <Link href="/dashboard" className="hover:underline">
        Dashboard
      </Link>
      <Link href="/animali" className="hover:underline">
        Animali
      </Link>
      <Link href="/animali/scadenze" className="hover:underline">
        Scadenze
      </Link>
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="hover:underline">
          Amministrazione
        </Link>
      )}
    </nav>
  );
}
