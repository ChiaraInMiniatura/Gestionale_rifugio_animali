// File speciale riconosciuto da Next.js: genera /manifest.webmanifest e lo
// collega da solo nell'<head> di ogni pagina (nessun <link rel="manifest">
// da scrivere a mano). È ciò che permette al browser di offrire
// "Installa app" / "Aggiungi a schermata Home".

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Un solo nome, mai una versione estesa: alcuni browser mostrano name e
    // short_name insieme (es. "Frida — gestionale rifugio - Frida"),
    // ridondante e confuso per chi usa l'app.
    name: "Frida",
    short_name: "Frida",
    description: "Gestionale del rifugio Frida: cani, cartelle sanitarie e adozioni.",
    // Mai "/": è ancora la pagina di scaffold non personalizzata (vedi
    // src/app/page.tsx). L'app installata deve aprirsi sulla dashboard,
    // stesso redirect già corretto altrove dopo il login (MOD9b).
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    lang: "it",
    icons: [
      { src: "/manifest-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/manifest-icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
