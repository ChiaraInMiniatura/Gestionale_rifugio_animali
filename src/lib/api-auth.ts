// Helper condiviso da tutte le rotte API sotto /api/animali: incapsula
// il controllo minimo comune (sessione presente e utente approvato),
// così ogni rotta non deve ripetere le stesse due righe di verifica.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Recupera la sessione corrente solo se l'utente è autenticato e
 * approvato; non fa distinzione di ruolo (quella, dove serve, resta
 * responsabilità della singola rotta che la richiama).
 *
 * Attenzione: a differenza di src/proxy.ts, questa funzione NON rilegge
 * "approved" dal database — si fida del valore già presente nel JWT di
 * sessione, impostato al momento del login (vedi callback jwt/session in
 * src/lib/auth.ts). Se un ADMIN revoca l'approvazione a un utente già
 * loggato, una chiamata diretta a queste rotte API (che bypassi il
 * proxy) continuerebbe ad essere accettata fino alla scadenza del token.
 * @returns la sessione se valida e approvata secondo il JWT, altrimenti null.
 */
export async function getSessioneApprovata() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.approved) {
    return null;
  }
  return session;
}
