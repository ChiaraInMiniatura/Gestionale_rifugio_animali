// Equivalente del middleware Next.js (Next 16 lo chiama "proxy"): gira
// prima di raggiungere le pagine protette elencate in `config.matcher`,
// verificando sessione, approvazione e ruolo. È solo il primo livello di
// difesa: ogni pagina/rotta API sotto verifica di nuovo in modo
// indipendente, perché il proxy da solo non basta a coprire chiamate
// dirette alle API (vedi getSessioneApprovata in src/lib/api-auth.ts).

import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const ADMIN_PREFIX = "/admin";

/**
 * Controlla, per ogni richiesta alle rotte protette, che l'utente sia
 * autenticato, approvato e (per /admin) abbia il ruolo ADMIN.
 * @param request richiesta in ingresso intercettata da Next.js.
 * @returns redirect a /login se manca un token valido o l'utente non è
 *   approvato; redirect a /dashboard se un non-ADMIN prova ad accedere a
 *   /admin; altrimenti lascia proseguire la richiesta (NextResponse.next()).
 */
export async function proxy(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  // getToken legge il JWT di sessione senza toccare il DB: economico, ma
  // dice solo "chi dice di essere l'utente", non il suo stato attuale.
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return NextResponse.redirect(loginUrl);
  }

  // Rilettura live da Postgres di approved/role: il JWT può restare
  // valido per giorni, ma se un ADMIN revoca l'approvazione o cambia
  // ruolo, l'effetto deve essere immediato alla richiesta successiva, non
  // solo al prossimo login. Fidarsi del solo JWT permetterebbe a un
  // account disapprovato di continuare a operare fino a scadenza token.
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      select: { approved: true, role: true },
    });
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  if (!user || !user.approved) {
    return NextResponse.redirect(loginUrl);
  }

  // Solo le rotte sotto /admin richiedono il ruolo ADMIN; le altre rotte
  // in matcher (dashboard, animali) bastano sessione+approvazione.
  if (request.nextUrl.pathname.startsWith(ADMIN_PREFIX) && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Il proxy gira solo su queste rotte (e sottopercorsi): le pagine
// pubbliche (/, /login, /registrazione) restano fuori di proposito.
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/animali/:path*"],
};
