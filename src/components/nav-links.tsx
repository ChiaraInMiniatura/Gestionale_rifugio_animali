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
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="hover:underline">
          Amministrazione
        </Link>
      )}
    </nav>
  );
}
