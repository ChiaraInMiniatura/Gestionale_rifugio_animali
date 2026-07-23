"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type PendingUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export function PendingUsers({ initialUsers }: { initialUsers: PendingUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  async function handleAzione(id: number, azione: "approve" | "reject") {
    setErrore(null);
    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/users/${id}/${azione}`, {
        method: azione === "approve" ? "PATCH" : "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrore(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
      router.refresh();
    } catch {
      setErrore("Impossibile contattare il server. Controlla la connessione e riprova.");
    } finally {
      setLoadingId(null);
    }
  }

  function handleRifiuta(user: PendingUser) {
    const confermato = window.confirm(
      `Rifiutare definitivamente la richiesta di ${user.email}? L'operazione elimina l'account e non è annullabile.`
    );
    if (confermato) {
      handleAzione(user.id, "reject");
    }
  }

  if (users.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Nessuna richiesta in attesa.
      </p>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {errore && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errore}</p>
      )}

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {user.name}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.email}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Registrata il {format(new Date(user.createdAt), "d MMMM yyyy", { locale: it })}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={loadingId === user.id}
                onClick={() => handleAzione(user.id, "approve")}
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Approva
              </button>
              <button
                type="button"
                disabled={loadingId === user.id}
                onClick={() => handleRifiuta(user)}
                className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Rifiuta
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
