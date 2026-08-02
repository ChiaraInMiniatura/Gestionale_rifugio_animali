// Root layout dell'App Router: avvolge ogni pagina con i Provider globali
// (sessione Auth.js, React Query) e un header comune con navigazione e
// logout, sempre visibile indipendentemente dalla rotta.

import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavLinks } from "@/components/nav-links";
import { BrandMark } from "@/components/brand-mark";

// Nunito: arrotondato e amichevole, scelto al posto del Geist di default
// (mai realmente applicato finora, vedi globals.css) per un'app di un
// rifugio pensata anche per un pubblico anziano.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frida",
  description: "Gestionale del rifugio Frida: cani, cartelle sanitarie e adozioni.",
};

// Colora la barra del browser su mobile (es. Chrome Android) con lo stesso
// accento del manifest, per coerenza visiva anche prima di installare —
// due valori (chiaro/scuro) invece di uno fisso, stessa logica dei token
// colore in globals.css. width/initialScale: senza questo export Next.js
// li genera da solo, ma dichiarando un viewport nostro dobbiamo includerli
// esplicitamente (altrimenti sparisce il tag responsive di default e il
// sito torna a renderizzare a larghezza desktop su ogni schermo).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d97b29" },
    { media: "(prefers-color-scheme: dark)", color: "#e59a4f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-ink">
        {/* Providers: qui vivono SessionProvider (Auth.js) e QueryClientProvider
            (React Query), condivisi da tutte le pagine client sotto. */}
        <Providers>
          {/* print:hidden — l'header di navigazione non ha senso su un
              documento stampato (es. la scheda clinica in .../scheda). */}
          <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 print:hidden">
            <BrandMark />
            {/* NavLinks contiene anche il logout, dentro il pannello del
                menu hamburger (vedi src/components/nav-links.tsx). */}
            <NavLinks />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
