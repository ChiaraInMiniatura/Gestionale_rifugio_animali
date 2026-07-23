// Endpoint catch-all richiesto da Auth.js v4 per il App Router: gestisce
// internamente login, logout, callback e recupero sessione (le rotte
// effettive, es. /api/auth/session, /api/auth/signin, sono generate da
// NextAuth stesso a partire da questo singolo file).

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// La configurazione (provider Credentials, callback JWT/session) vive in
// src/lib/auth.ts: qui la si collega solo alle rotte HTTP.
const handler = NextAuth(authOptions);

// Auth.js instrada sia GET (es. recupero sessione) sia POST (es. login)
// sullo stesso handler.
export { handler as GET, handler as POST };
