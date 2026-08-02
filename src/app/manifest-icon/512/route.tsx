// Icona 512×512 richiesta dal web manifest (Android/desktop): stessa
// forma di src/lib/icona-app.tsx, servita come route perché il manifest
// ha bisogno di più dimensioni oltre a quella gestita da icon.tsx.

import { generaIconaApp } from "@/lib/icona-app";

export function GET() {
  return generaIconaApp(512);
}
