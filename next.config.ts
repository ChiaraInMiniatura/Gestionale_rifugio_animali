// Configurazione di Next.js, letta da next dev/build/start prima di
// qualunque altro modulo dell'app: oltre alle opzioni del framework, è il
// punto più precoce del processo Node per fissare impostazioni globali
// come il fuso orario (vedi sotto).

import type { NextConfig } from "next";

// Fissa il fuso orario dell'intero processo Node a Europe/Rome, prima che
// qualunque altro modulo esegua codice: senza questo, new Date(stringaSenzaOffset)
// (es. dagli input datetime-local della cartella clinica) e date-fns format()
// vengono interpretati/mostrati nel fuso del server (spesso UTC in hosting cloud),
// non in quello delle volontarie in Italia — scarto di 1-2 ore tra salvataggio
// e visualizzazione. L'app è mono-fuso per un rifugio italiano, quindi un solo
// valore fisso qui è sufficiente (va verificato che l'hosting di produzione
// rispetti questa variabile).
process.env.TZ = "Europe/Rome";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
