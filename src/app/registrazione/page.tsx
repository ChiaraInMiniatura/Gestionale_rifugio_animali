// Pagina pubblica di registrazione: form client per richiedere un nuovo
// account VOLONTARIA. Non fa login automatico dopo l'invio: l'account
// resta in attesa finché un ADMIN non lo approva (vedi /admin).

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registrazioneSchema,
  type RegistrazioneInput,
} from "@/lib/validations/registrazione";

export default function RegistrazionePage() {
  // "inviata" distingue il form dalla schermata di conferma dopo il
  // successo, senza bisogno di un redirect (non c'è nulla da vedere
  // subito dopo: l'account non è ancora utilizzabile).
  const [inviata, setInviata] = useState(false);
  const [erroreServer, setErroreServer] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrazioneInput>({
    // Stesso schema Zod della rotta API: gli errori di validazione
    // mostrati qui rispecchiano esattamente quelli che il server
    // applicherebbe comunque, anche se qualcuno bypassasse questo form.
    resolver: zodResolver(registrazioneSchema),
  });

  async function onSubmit(data: RegistrazioneInput) {
    setErroreServer(null);

    const res = await fetch("/api/registrazione", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setInviata(true);
      return;
    }

    const body = await res.json();
    setErroreServer(body.message ?? "Si è verificato un errore. Riprova.");
  }

  if (inviata) {
    return (
      <div className="flex flex-1 items-center justify-center bg-page px-4">
        <p className="max-w-md text-center text-lg text-ink">
          Registrazione inviata. Il tuo account è in attesa di approvazione.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        <h1 className="mb-6 text-xl font-semibold text-ink">
          Registrazione volontaria/o
        </h1>

        <div className="mb-4">
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink-soft">
            Nome
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-danger">{errors.name.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-soft">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-soft">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="w-full rounded-xl border border-line bg-page px-3 py-2 text-ink"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
          )}
        </div>

        {erroreServer && (
          <p className="mb-4 text-sm text-danger">{erroreServer}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-accent px-5 py-2.5 font-medium text-white transition hover:scale-[1.02] hover:bg-accent-hover active:scale-95 active:bg-accent-active disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Invio in corso..." : "Registrati"}
        </button>
      </form>
    </div>
  );
}
