// Configurazione centrale di Auth.js v4: un solo provider Credentials
// (email+password), sessione JWT (non basata su tabella Session nel DB),
// e callback che copiano i dati rilevanti dal token utente al token JWT
// e poi alla sessione esposta ai componenti.

import bcrypt from "bcrypt";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/login";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenziali",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize gira solo lato server: qui, e solo qui, è sicuro
      // confrontare la password in chiaro ricevuta con l'hash bcrypt
      // salvato nel DB.
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Credenziali non valide");
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new Error("Credenziali non valide");
        }

        const passwordOk = await bcrypt.compare(password, user.password);
        if (!passwordOk) {
          throw new Error("Credenziali non valide");
        }

        // Blocco esplicito qui, al momento del login: un account non
        // ancora approvato non deve nemmeno ottenere una sessione, non
        // solo essere bloccato più avanti dal proxy.
        if (!user.approved) {
          throw new Error("Il tuo account è in attesa di approvazione");
        }

        // Nessuna password/hash in ciò che authorize restituisce: questo
        // oggetto è ciò che il callback jwt riceve come "user".
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          approved: user.approved,
        };
      },
    }),
  ],
  callbacks: {
    // jwt gira ad ogni richiesta che tocca il token, ma "user" è definito
    // solo al login: è qui che i dati passano una volta dal DB al token.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.approved = user.approved;
      }
      return token;
    },
    // session traduce il contenuto del token in ciò che useSession() e
    // getServerSession() restituiscono ai componenti. Da notare: questi
    // valori (in particolare "approved") sono quelli del login, non
    // rivalidati qui — per questo proxy.ts e getSessioneApprovata()
    // rileggono sempre lo stato reale dal DB prima di fidarsene.
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.approved = token.approved;
      return session;
    },
  },
};
