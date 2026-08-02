// File speciale riconosciuto da Next.js: genera l'icona/favicon dell'app
// (sostituisce il favicon.ico di scaffold, altrimenti resterebbe come
// fallback il logo Next.js di default in alcuni browser).

import { generaIconaApp } from "@/lib/icona-app";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return generaIconaApp(32);
}
