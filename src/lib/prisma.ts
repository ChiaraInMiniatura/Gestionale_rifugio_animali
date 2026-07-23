// Istanza singleton del client Prisma, condivisa da tutte le rotte API e
// server component. In sviluppo, Next.js ricarica i moduli ad ogni
// modifica (Fast Refresh): senza il pattern globalThis qui sotto, ogni
// reload creerebbe un nuovo PrismaClient (e una nuova connessione al DB),
// finché non si esauriscono le connessioni disponibili di Postgres.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Adapter "prisma-client" (Prisma 7) verso Postgres: la stringa di
// connessione arriva da DATABASE_URL (.env, mai committato).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Il riuso dell'istanza va limitato allo sviluppo: in produzione ogni
// processo ha il suo ciclo di vita naturale, non serve (né si vuole)
// tenere lo stato su globalThis tra riavvii.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
