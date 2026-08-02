// Pagina pubblica di login: usa signIn("credentials", { redirect: false })
// invece del redirect automatico di Auth.js, per poter mostrare l'errore
// (es. account non approvato) restando sulla stessa pagina.

"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/login";

export default function LoginPage() {
  const router = useRouter();
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

    // router.refresh() forza il re-fetch dei server component (es.
    // header con NavLinks) così da riflettere subito la nuova sessione,
    // cosa che router.push da solo non garantirebbe.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-teal-100 px-4 dark:bg-[#04120f]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Accedi
        </h1>

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
          className="w-full rounded-full bg-teal-700 px-5 py-2.5 font-medium text-white transition hover:scale-[1.02] hover:bg-teal-600 active:scale-95 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700"
        >
          {isSubmitting ? "Accesso in corso..." : "Accedi"}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Non hai un account?{" "}
          <Link href="/registrazione" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Registrati
          </Link>
        </p>
      </form>
    </div>
  );
}
