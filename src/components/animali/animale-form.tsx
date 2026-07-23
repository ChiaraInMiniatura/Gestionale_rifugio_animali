// Form condiviso da creazione e modifica animale: la sola presenza di
// animaleIniziale decide la modalità (POST vs PATCH, precompilazione dei
// campi). Nessuna duplicazione tra le due pagine che lo usano
// (animali/nuovo e animali/[id]/modifica): il form stesso è l'unica
// fonte di verità per validazione e invio.

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { animaleSchema, FOTO_MAX_LENGTH, type AnimaleInput } from "@/lib/validations/animale";
import { comprimiImmagine } from "@/lib/comprimi-immagine";
import type { Specie, Sesso } from "@/generated/prisma/enums";

type AnimaleIniziale = {
  id: number;
  nome: string;
  specie: Specie;
  razza: string | null;
  dataNascita: Date | null;
  descrizione: string | null;
  note: string | null;
  foto: string | null;
  sesso: Sesso | null;
  sterilizzato: boolean | null;
};

// L'input HTML type="date" richiede il formato "YYYY-MM-DD" come stringa:
// questa funzione fa da ponte tra il Date di Prisma e quel formato.
function toDateInputValue(d: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function AnimaleForm({ animaleIniziale }: { animaleIniziale?: AnimaleIniziale }) {
  const router = useRouter();
  const [erroreServer, setErroreServer] = useState<string | null>(null);
  const [erroreFoto, setErroreFoto] = useState<string | null>(null);
  const [elaborazioneFoto, setElaborazioneFoto] = useState(false);
  // Riferimento all'input file nascosto: permette al bottone "Carica/
  // Cambia foto" di aprire il selettore file senza mostrare l'input
  // grezzo del browser, meno intuitivo per utenti non tecnici.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnimaleInput>({
    // Stesso schema Zod della rotta API: eventuali errori mostrati qui
    // sono gli stessi che il server applicherebbe comunque.
    resolver: zodResolver(animaleSchema),
    defaultValues: animaleIniziale
      ? {
          nome: animaleIniziale.nome,
          specie: animaleIniziale.specie,
          razza: animaleIniziale.razza ?? "",
          dataNascita: toDateInputValue(animaleIniziale.dataNascita),
          descrizione: animaleIniziale.descrizione ?? "",
          note: animaleIniziale.note ?? "",
          foto: animaleIniziale.foto ?? undefined,
          sesso: animaleIniziale.sesso ?? undefined,
          sterilizzato: animaleIniziale.sterilizzato ?? undefined,
        }
      : { specie: "CANE" },
  });

  // watch (non un semplice defaultValue) perché la foto cambia durante la
  // sessione di modifica (dopo l'upload), e l'anteprima deve aggiornarsi
  // subito senza aspettare il submit.
  const foto = watch("foto");

  /**
   * Gestisce la selezione di un file immagine: lo comprime/ridimensiona
   * lato client prima di scriverlo nel form, per restare sotto la soglia
   * di dimensione accettata dal server senza dover fare un secondo giro
   * di andata/ritorno in caso di rifiuto.
   * @param event evento onChange dell'input file nascosto.
   */
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setErroreFoto(null);
    setElaborazioneFoto(true);

    try {
      const dataUrl = await comprimiImmagine(file);

      // Anche dopo la compressione lato client la soglia va rispettata:
      // è la stessa verificata (di nuovo) lato server in FOTO_MAX_LENGTH.
      if (dataUrl.length > FOTO_MAX_LENGTH) {
        setErroreFoto("L'immagine è troppo grande anche dopo la compressione. Prova con un'altra foto.");
        return;
      }

      setValue("foto", dataUrl, { shouldDirty: true });
    } catch {
      setErroreFoto("Il file selezionato non è un'immagine valida.");
    } finally {
      setElaborazioneFoto(false);
      event.target.value = "";
    }
  }

  /**
   * Invia i dati del form: POST per un nuovo animale, PATCH per uno
   * esistente. La scelta dipende solo dalla presenza di animaleIniziale.
   * @param data dati già validati da Zod (via zodResolver), pronti per
   *   essere serializzati e inviati.
   */
  async function onSubmit(data: AnimaleInput) {
    setErroreServer(null);

    const url = animaleIniziale ? `/api/animali/${animaleIniziale.id}` : "/api/animali";
    const method = animaleIniziale ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErroreServer(body?.message ?? "Si è verificato un errore. Riprova.");
        return;
      }

      const animale = await res.json();
      router.push(`/animali/${animale.id}`);
      router.refresh();
    } catch {
      setErroreServer("Impossibile contattare il server. Controlla la connessione e riprova.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {animaleIniziale ? "Modifica animale" : "Nuovo animale"}
      </h1>

      <div className="mb-4">
        <label htmlFor="nome" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nome
        </label>
        <input
          id="nome"
          type="text"
          {...register("nome")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {errors.nome && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nome.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="specie" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Specie
        </label>
        <select
          id="specie"
          {...register("specie")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="CANE">Cane</option>
          <option value="GATTO">Gatto</option>
          <option value="ALTRO">Altro</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="sesso" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Sesso
        </label>
        <select
          id="sesso"
          // setValueAs converte la stringa vuota (opzione "Non noto") in
          // undefined, coerente con Sesso essere .optional() nello schema
          // Zod: senza questo, "" verrebbe rifiutato come valore non
          // valido dell'enum invece di essere trattato come "non specificato".
          {...register("sesso", { setValueAs: (v) => (v === "" ? undefined : (v as Sesso)) })}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">Non noto</option>
          <option value="MASCHIO">Maschio</option>
          <option value="FEMMINA">Femmina</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="sterilizzato" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Sterilizzato
        </label>
        <select
          id="sterilizzato"
          // Stessa logica del select Sesso, ma per un booleano tri-stato:
          // "" → undefined (non specificato), altrimenti confronto con la
          // stringa "true" per ottenere un vero booleano JS.
          {...register("sterilizzato", {
            setValueAs: (v) => (v === "" ? undefined : v === "true"),
          })}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">Non specificato</option>
          <option value="true">Sì</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="razza" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Razza
        </label>
        <input
          id="razza"
          type="text"
          {...register("razza")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="dataNascita" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Data di nascita (indicativa se non nota con precisione)
        </label>
        <input
          id="dataNascita"
          type="date"
          {...register("dataNascita")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {errors.dataNascita && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dataNascita.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="descrizione" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Descrizione
        </label>
        <textarea
          id="descrizione"
          rows={3}
          {...register("descrizione")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="note" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Note
        </label>
        <textarea
          id="note"
          rows={3}
          {...register("note")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="foto" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Foto
        </label>
        {foto && (
          <img
            src={foto}
            alt="Anteprima"
            className="mb-3 h-48 w-full rounded-md object-cover"
          />
        )}
        {/* Input file nascosto (className="hidden"): resta associato alla
            label tramite id/htmlFor per l'accessibilità, ma l'apertura
            del selettore file passa dal bottone sotto, più chiaro per
            chi non è pratico di form web. */}
        <input
          ref={fileInputRef}
          id="foto"
          type="file"
          accept="image/*"
          disabled={elaborazioneFoto}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={elaborazioneFoto}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {foto ? "Cambia foto" : "Carica foto"}
        </button>
        {elaborazioneFoto && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">Elaborazione immagine...</p>
        )}
        {erroreFoto && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erroreFoto}</p>
        )}
        {errors.foto && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.foto.message}</p>
        )}
      </div>

      {erroreServer && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{erroreServer}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || elaborazioneFoto}
        className="w-full rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isSubmitting ? "Salvataggio in corso..." : "Salva"}
      </button>
    </form>
  );
}
