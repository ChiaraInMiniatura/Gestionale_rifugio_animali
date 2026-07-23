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
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <p className="max-w-md text-center text-lg text-zinc-800 dark:text-zinc-200">
          Registrazione inviata. Il tuo account è in attesa di approvazione.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Registrazione volontaria
        </h1>

        <div className="mb-4">
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nome
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {erroreServer && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{erroreServer}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isSubmitting ? "Invio in corso..." : "Registrati"}
        </button>
      </form>
    </div>
  );
}
