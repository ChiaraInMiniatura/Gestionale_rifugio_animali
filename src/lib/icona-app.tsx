// Genera l'icona dell'app (due zampe bianche su sfondo teal) in qualunque
// dimensione richiesta. Un'unica fonte per la forma — validata a schermo
// con l'utente prima di scriverla qui — riusata da favicon, icona Apple e
// icone del manifest, invece di ridisegnarla in ciascun file.

import { ImageResponse } from "next/og";

const TEAL = "#0f766e";

// Un cuscinetto + 4 ditini, senza rotazione sui singoli ditini: forma
// semplice e leggibile anche alle dimensioni più piccole (32px).
// Funzione semplice, mai un componente JSX (<Zampa />): Satori, il motore
// dietro ImageResponse, non risolve i componenti custom come figli di
// <svg> (verificato: anche un singolo componente con radice <g> unica
// produce un'immagine vuota). Chiamata come {zampa(...)} l'albero arriva
// già risolto, senza passare da un "componente" agli occhi di Satori.
function zampa(transform: string) {
  return (
    <g transform={transform}>
      <ellipse cx="50" cy="66" rx="26" ry="20" fill="white" />
      <ellipse cx="19" cy="40" rx="11" ry="14" fill="white" />
      <ellipse cx="40" cy="22" rx="11" ry="14.5" fill="white" />
      <ellipse cx="60" cy="22" rx="11" ry="14.5" fill="white" />
      <ellipse cx="81" cy="40" rx="11" ry="14" fill="white" />
    </g>
  );
}

/**
 * Genera l'icona dell'app come immagine PNG quadrata.
 * @param dimensione lato dell'icona in pixel (es. 32, 180, 192, 512).
 * @returns una ImageResponse (next/og) pronta da restituire da una route
 *   o da un file icona di Next.js.
 */
export function generaIconaApp(dimensione: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: TEAL,
        }}
      >
        <svg viewBox="0 0 100 100" width={dimensione} height={dimensione}>
          {/* Due zampe in diagonale, come le orme di un cagnolino di
              passaggio: stesse coordinate scelte con l'utente. */}
          {zampa("translate(-2 -2) scale(0.65)")}
          {zampa("translate(38 40) scale(0.65)")}
        </svg>
      </div>
    ),
    { width: dimensione, height: dimensione },
  );
}
