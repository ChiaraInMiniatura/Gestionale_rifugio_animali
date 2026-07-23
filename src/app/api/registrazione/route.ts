// Rotta pubblica per la richiesta di un nuovo account volontaria: valida
// l'input, verifica l'unicità dell'email e salva la password come hash
// bcrypt. L'account creato nasce non approvato (approved=false di default
// nello schema): il login resta bloccato finché un ADMIN non lo approva.

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { registrazioneSchema } from "@/lib/validations/registrazione";

/**
 * Crea un nuovo account VOLONTARIA in attesa di approvazione.
 * @param request corpo JSON con { name, email, password }, rivalidato qui
 *   con lo stesso schema Zod usato dal form client (mai fidarsi solo
 *   della validazione lato client).
 * @returns 201 con i dati pubblici dell'utente creato; 400 se i dati non
 *   passano Zod; 409 se l'email è già registrata.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registrazioneSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  // Controllo esplicito di duplicazione: il vincolo @unique su email nel
  // DB impedirebbe comunque l'inserimento, ma qui si intercetta prima per
  // restituire un messaggio chiaro invece di un errore Prisma generico.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { message: "Esiste già un account con questa email" },
      { status: 409 }
    );
  }

  // bcrypt con costo 10: la password in chiaro non tocca mai il database.
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  // Risposta volutamente priva di password/hash e di campi interni: solo
  // ciò che serve al client per confermare la richiesta.
  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email },
    { status: 201 }
  );
}
