import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessioneApprovata } from "@/lib/api-auth";
import { animaleSchema, normalizzaAnimale, statoAnimaleSchema } from "@/lib/validations/animale";

const CAMPI_BASE = ["nome", "specie", "razza", "dataNascita", "descrizione", "note", "sesso", "sterilizzato"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  const animale = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!animale) {
    return NextResponse.json({ message: "Animale non trovato" }, { status: 404 });
  }

  return NextResponse.json(animale);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  const haCampoStato = Object.prototype.hasOwnProperty.call(body, "stato");

  // Cambio di stato: operazione separata, riservata all'ADMIN.
  // getSessioneApprovata() verifica solo sessione+approved: il ruolo
  // va controllato qui, in aggiunta, per questo ramo specifico.
  if (haCampoStato && session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const haAltriCampi = CAMPI_BASE.some((campo) =>
    Object.prototype.hasOwnProperty.call(body, campo)
  );

  if (haCampoStato && haAltriCampi) {
    return NextResponse.json(
      {
        message:
          "Non è possibile modificare lo stato insieme ad altri campi nella stessa richiesta",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!existing) {
    return NextResponse.json({ message: "Animale non trovato" }, { status: 404 });
  }

  if (haCampoStato) {
    const parsed = statoAnimaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const animale = await prisma.animale.update({
      where: { id: animaleId },
      data: { stato: parsed.data.stato },
    });
    return NextResponse.json(animale);
  }

  const parsed = animaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const animale = await prisma.animale.update({
    where: { id: animaleId },
    data: normalizzaAnimale(parsed.data),
  });
  return NextResponse.json(animale);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessioneApprovata();
  // Eliminazione riservata all'ADMIN: getSessioneApprovata() non basta,
  // serve il controllo esplicito del ruolo anche qui.
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const { id } = await params;
  const animaleId = Number(id);
  if (Number.isNaN(animaleId)) {
    return NextResponse.json({ message: "Id non valido" }, { status: 400 });
  }

  const existing = await prisma.animale.findUnique({ where: { id: animaleId } });
  if (!existing) {
    return NextResponse.json({ message: "Animale non trovato" }, { status: 404 });
  }

  await prisma.animale.delete({ where: { id: animaleId } });
  return NextResponse.json({ id: animaleId });
}
