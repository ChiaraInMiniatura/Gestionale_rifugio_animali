// File speciale riconosciuto da Next.js: icona per "Aggiungi a schermata
// Home" su iOS/Safari, che non legge il web manifest per questo e vuole
// la propria icona dedicata.

import { generaIconaApp } from "@/lib/icona-app";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return generaIconaApp(180);
}
