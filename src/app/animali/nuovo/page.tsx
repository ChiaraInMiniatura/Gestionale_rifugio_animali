// Pagina di creazione: wrapper sottile attorno ad AnimaleForm, chiamato
// senza animaleIniziale così il form sa di essere in modalità "nuovo"
// (POST invece di PATCH, vedi src/components/animali/animale-form.tsx).

import { AnimaleForm } from "@/components/animali/animale-form";

export default function NuovoAnimalePage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4 py-10">
      <AnimaleForm />
    </div>
  );
}
