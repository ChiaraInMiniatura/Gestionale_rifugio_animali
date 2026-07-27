// Bottone di logout mostrato nell'header (vedi src/app/layout.tsx): si
// nasconde da solo se non c'è sessione, così non serve un controllo
// esplicito nel layout che lo include.

"use client";

import { signOut, useSession } from "next-auth/react";

export function LogoutButton() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:scale-105 hover:bg-zinc-100 active:scale-95 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
    >
      Esci
    </button>
  );
}
