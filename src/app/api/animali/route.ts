import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessioneApprovata } from "@/lib/api-auth";
import { animaleSchema, normalizzaAnimale } from "@/lib/validations/animale";

export async function GET() {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  const animali = await prisma.animale.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      specie: true,
      razza: true,
      dataNascita: true,
      stato: true,
      createdAt: true,
    },
  });
  return NextResponse.json(animali);
}

export async function POST(request: Request) {
  const session = await getSessioneApprovata();
  if (!session) {
    return NextResponse.json({ message: "Non autorizzata" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 });
  }

  const parsed = animaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const animale = await prisma.animale.create({ data: normalizzaAnimale(parsed.data) });
  return NextResponse.json(animale, { status: 201 });
}
