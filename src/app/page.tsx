// Pagina "/": mai coperta dal proxy (vedi matcher in src/proxy.ts) e mai
// stata personalizzata — era ancora lo scaffold di create-next-app.
// Nessuna interfaccia propria: reindirizza subito a dashboard (se già
// loggati) o al login, così non resta un punto di ingresso morto se
// qualcuno apre il sito dalla root o dall'icona installata prima del login.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  redirect(session ? "/dashboard" : "/login");
}
