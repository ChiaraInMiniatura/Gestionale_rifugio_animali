// Bottone "Installa l'app" mostrato in dashboard: pubblico anziano, non
// possiamo contare sul fatto che qualcuno noti l'iconcina di installazione
// nascosta nella barra del browser. Comportamento diverso per piattaforma,
// perché le API disponibili sono diverse (vedi sotto).

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// TypeScript non include ancora questo evento nei tipi standard del DOM:
// è specifico di Chrome/Edge/Android, non uno standard W3C.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// matchMedia/navigator esistono solo lato client: durante il render sul
// server (questo è comunque un client component, ma Next.js lo pre-renderizza
// lì) leggerli darebbe risultati diversi da quelli del client, disallineando
// l'HTML dell'hydration. useSyncExternalStore è lo strumento pensato apposta
// per questo caso — niente setState dentro un effect, niente disallineamento.
function leggiInstallata() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // proprietà non standard, solo Safari iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
function leggiInstallataServer() {
  return false;
}
function sottoscriviInstallata(callback: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    mql.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function leggiIsIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
function leggiIsIOSServer() {
  return false;
}
function nessunaSottoscrizione() {
  // Il tipo di dispositivo non cambia durante la sessione: nessun evento a
  // cui iscriversi, serve solo la funzione di "unsubscribe" vuota richiesta
  // dall'API di useSyncExternalStore.
  return () => {};
}

/**
 * Bottone che avvia l'installazione dell'app come icona (Chrome/Edge) o
 * mostra le istruzioni per farlo (iOS/Safari, dove non esiste un'API per
 * farlo da codice). Non mostra nulla se l'app è già installata o se il
 * browser non offre nessuna delle due strade.
 */
export function InstallaAppButton() {
  const installata = useSyncExternalStore(
    sottoscriviInstallata,
    leggiInstallata,
    leggiInstallataServer,
  );
  const isIOS = useSyncExternalStore(nessunaSottoscrizione, leggiIsIOS, leggiIsIOSServer);

  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostraIstruzioniIOS, setMostraIstruzioniIOS] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(evento: Event) {
      // Impedisce il mini-banner automatico del browser: mostriamo il
      // nostro bottone invece, coerente con il resto dell'interfaccia.
      evento.preventDefault();
      setPrompt(evento as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installata) {
    return null;
  }

  async function installa() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    // Il prompt del browser si può usare una sola volta.
    setPrompt(null);
  }

  if (prompt) {
    return (
      <button
        type="button"
        onClick={installa}
        className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800"
      >
        Installa l&apos;app
      </button>
    );
  }

  if (isIOS) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setMostraIstruzioniIOS((v) => !v)}
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800"
        >
          Installa l&apos;app
        </button>
        {mostraIstruzioniIOS && (
          <p className="mt-2 max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
            Su iPhone/iPad non si può installare da qui: tocca il pulsante
            Condividi (il quadratino con la freccia in su) nel browser, poi
            &quot;Aggiungi a Home&quot;.
          </p>
        )}
      </div>
    );
  }

  // Browser senza nessuna delle due strade (es. Firefox desktop): nessun
  // bottone che promette un'azione che qui non può funzionare.
  return null;
}
