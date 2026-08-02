// Pagina pubblica di login: usa signIn("credentials", { redirect: false })
// invece del redirect automatico di Auth.js, per poter mostrare l'errore
// (es. account non approvato) restando sulla stessa pagina.

"use client";

import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/login";

export default function LoginPage() {
  const [erroreServer, setErroreServer] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setErroreServer(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (res?.error) {
      // Il messaggio (es. "Account non ancora approvato") arriva dal
      // provider Credentials configurato in src/lib/auth.ts.
      setErroreServer(res.error);
      return;
    }

    // Navigazione vera (non router.push): con router.push, in questa
    // versione di Next.js, la navigazione lato client verso una rotta
    // protetta dal proxy a volte non scatta pur con signIn riuscito
    // (sessione valida, ok:true) — resta sulla pagina di login senza
    // errori. Un cambio pagina vero, verificato affidabile, evita il problema.
    window.location.assign("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        <h1 className="mb-6 text-xl font-semibold text-ink">
          Accedi
        </h1>

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
          {isSubmitting ? "Accesso in corso..." : "Accedi"}
        </button>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Non hai un account?{" "}
          <Link href="/registrazione" className="font-medium text-positive underline">
            Registrati
          </Link>
        </p>
      </form>
    </div>
  );
}
