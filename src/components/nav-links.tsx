// Menu di navigazione dell'header: icona hamburger sempre visibile, che
// apre un pannello a piena larghezza con i link (in base a sessione/ruolo),
// la voce "Installa l'app" e il bottone Esci. Sostituisce il "vai a capo
// su due righe" di MOD9 (scelto allora apposta per un pubblico anziano,
// per non nascondere la navigazione dietro un'icona) — cambio voluto
// esplicitamente dall'utente nel restyling MOD13: l'icona resta comunque
// grande e sempre visibile, e una volta aperto il pannello i link sono a
// piena larghezza e ben leggibili.

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const VOCI = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/animali", label: "Animali" },
  { href: "/animali/scadenze", label: "Scadenze" },
] as const;

// TypeScript non include ancora questo evento nei tipi standard del DOM:
// è specifico di Chrome/Edge/Android, non uno standard W3C.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function leggiIsIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
function leggiIsIOSServer() {
  return false;
}
function leggiIsAndroid() {
  return /android/i.test(window.navigator.userAgent);
}
function leggiIsAndroidServer() {
  return false;
}
function nessunaSottoscrizione() {
  return () => {};
}

export function NavLinks() {
  const { data: session } = useSession();
  const [aperto, setAperto] = useState(false);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostraIstruzioni, setMostraIstruzioni] = useState(false);
  const isIOS = useSyncExternalStore(nessunaSottoscrizione, leggiIsIOS, leggiIsIOSServer);
  const isAndroid = useSyncExternalStore(nessunaSottoscrizione, leggiIsAndroid, leggiIsAndroidServer);

  useEffect(() => {
    function onBeforeInstallPrompt(evento: Event) {
      // Impedisce il mini-banner automatico del browser: mostriamo la
      // nostra voce di menu invece, coerente col resto dell'interfaccia.
      evento.preventDefault();
      setPrompt(evento as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!session) {
    return null;
  }

  const voci = [
    ...VOCI,
    ...(session.user.role === "ADMIN"
      ? [{ href: "/admin", label: "Amministrazione" } as const]
      : []),
  ];

  // Voce sempre presente nel menu, indipendentemente da cosa rileva il
  // browser (installata o meno, evento beforeinstallprompt catturato o
  // no): la rilevazione automatica non è affidabile ovunque, meglio dare
  // sempre un modo di provare piuttosto che nasconderla per errore.
  async function handleInstalla() {
    if (prompt) {
      setAperto(false);
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
      return;
    }
    // Senza un prompt catturato (iOS, o un browser che non lo supporta),
    // non c'è un'azione da eseguire: si mostra solo una spiegazione,
    // tenendo il pannello aperto perché possa leggerla con calma.
    setMostraIstruzioni((v) => !v);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        aria-expanded={aperto}
        aria-label={aperto ? "Chiudi il menu" : "Apri il menu"}
        className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-xl border border-line transition hover:scale-105 hover:bg-surface active:scale-95"
      >
        <span
          className={`h-0.5 w-6 rounded-full bg-ink transition ${aperto ? "translate-y-2 rotate-45" : ""}`}
        />
        <span className={`h-0.5 w-6 rounded-full bg-ink transition ${aperto ? "opacity-0" : ""}`} />
        <span
          className={`h-0.5 w-6 rounded-full bg-ink transition ${aperto ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {aperto && (
        <nav className="absolute right-0 top-[calc(100%+0.6rem)] z-20 flex w-64 flex-col gap-1 rounded-2xl border border-line bg-surface p-2 shadow-lg">
          {voci.map((voce) => (
            <Link
              key={voce.href}
              href={voce.href}
              onClick={() => setAperto(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-ink transition hover:bg-page active:scale-[0.98]"
            >
              {voce.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={handleInstalla}
            className="rounded-xl border-t border-line px-4 py-3 text-left text-base font-medium text-ink transition hover:bg-page active:scale-[0.98]"
          >
            Installa l&apos;app
          </button>
          {mostraIstruzioni && (
            <p className="px-4 pb-2 text-sm text-ink-soft">
              {isIOS
                ? 'Su iPhone/iPad: tocca Condividi (il quadratino con la freccia in su), poi "Aggiungi a Home".'
                : isAndroid
                  ? 'Tocca il menu ⋮ in alto a destra del browser, poi "Aggiungi a schermata Home" o "Installa app".'
                  : 'Cerca l\'icona di installazione nella barra degli indirizzi del browser (a forma di monitor con una freccia, vicino ai preferiti) e clicca su di essa.'}
            </p>
          )}

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 rounded-xl border-t border-line px-4 py-3 text-left text-base font-medium text-danger transition hover:bg-danger-soft active:scale-[0.98]"
          >
            Esci
          </button>
        </nav>
      )}
    </div>
  );
}
