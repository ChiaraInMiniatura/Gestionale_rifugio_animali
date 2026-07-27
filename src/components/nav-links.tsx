// Link di navigazione nell'header: visibili solo se c'è una sessione, e
// il link "Amministrazione" solo per il ruolo ADMIN. Questo filtro è solo
// estetico (nasconde link non pertinenti): l'accesso reale alle pagine è
// comunque riverificato dal proxy e dalle pagine stesse.
//
// flex-wrap invece di un menu hamburger su schermo stretto: per un
// pubblico anziano/non tecnico nascondere la navigazione dietro un'icona
// da riconoscere e toccare è un ostacolo, non un miglioramento — con solo
// 3-4 voci va bene che vadano semplicemente a capo su una seconda riga.

"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function NavLinks() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      <Link href="/dashboard" className="inline-block transition hover:scale-105 hover:underline active:scale-95 active:underline">
        Dashboard
      </Link>
      <Link href="/animali" className="inline-block transition hover:scale-105 hover:underline active:scale-95 active:underline">
        Animali
      </Link>
      <Link href="/animali/scadenze" className="inline-block transition hover:scale-105 hover:underline active:scale-95 active:underline">
        Scadenze
      </Link>
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="inline-block transition hover:scale-105 hover:underline active:scale-95 active:underline">
          Amministrazione
        </Link>
      )}
    </nav>
  );
}
