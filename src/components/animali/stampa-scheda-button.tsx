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
      className="print:hidden rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:scale-105 hover:bg-teal-600 active:scale-95 active:bg-teal-800"
    >
      Stampa questa scheda
    </button>
  );
}
