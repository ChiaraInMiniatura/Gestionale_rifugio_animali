// Bottone "Stampa questa scheda": invoca la stampa nativa del browser
// (Ctrl+P fa esattamente lo stesso, ma un bottone visibile è più
// scopribile per chi non conosce la scorciatoia). print:hidden — non ha
// senso nel documento stampato, serve solo nella vista a schermo.

"use client";

export function StampaSchedaButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      // Colore fisso (non i token bg-accent/hover/active): questa pagina
      // resta sempre chiara a prescindere dal tema (vedi header del file
      // scheda/page.tsx), quindi anche il bottone non deve seguire il tema
      // scuro come il resto dell'app.
      className="print:hidden rounded-full bg-[#d97b29] px-4 py-2 text-sm font-medium text-white transition hover:scale-105 hover:bg-[#c2650f] active:scale-95 active:bg-[#a8570d]"
    >
      Stampa questa scheda
    </button>
  );
}
