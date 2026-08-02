// Logo "Frida" nell'header: stessa forma a due zampe dell'icona dell'app
// (src/lib/icona-app.tsx), qui come SVG inline invece che generata via
// next/og — serve solo a schermo, non come immagine/icona di sistema.
// Cliccabile: riporta alla dashboard, convenzione comune per il logo in
// un header.

import Link from "next/link";

export function BrandMark() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 font-extrabold text-positive transition hover:scale-105 active:scale-95"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-hover">
        <svg viewBox="0 0 100 100" className="h-[60%] w-[60%]">
          <g transform="translate(-2 -2) scale(0.65)">
            <ellipse cx="50" cy="66" rx="26" ry="20" fill="white" />
            <ellipse cx="19" cy="40" rx="11" ry="14" fill="white" />
            <ellipse cx="40" cy="22" rx="11" ry="14.5" fill="white" />
            <ellipse cx="60" cy="22" rx="11" ry="14.5" fill="white" />
            <ellipse cx="81" cy="40" rx="11" ry="14" fill="white" />
          </g>
          <g transform="translate(38 40) scale(0.65)">
            <ellipse cx="50" cy="66" rx="26" ry="20" fill="white" />
            <ellipse cx="19" cy="40" rx="11" ry="14" fill="white" />
            <ellipse cx="40" cy="22" rx="11" ry="14.5" fill="white" />
            <ellipse cx="60" cy="22" rx="11" ry="14.5" fill="white" />
            <ellipse cx="81" cy="40" rx="11" ry="14" fill="white" />
          </g>
        </svg>
      </span>
      Frida
    </Link>
  );
}
