import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filmUpdateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const film = await prisma.film.findUnique({
    where: { id: params.id },
    include: {
      materials: { orderBy: [{ isRequired: "desc" }, { type: "asc" }] },
      submissions: {
        orderBy: { createdAt: "desc" },
        include: { festivalEdition: { include: { festivalMaster: true } } },
      },
      distributionPlans: {
        include: { entries: { select: { id: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { submissions: true, tasks: true } },
    },
  });
  if (!film) return NextResponse.json({ error: "Film non trovato" }, { status: 404 });
  return NextResponse.json(film);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = filmUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const film = await prisma.film.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(film);
  } catch {
    return NextResponse.json({ error: "Film non trovato" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.film.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Film non trovato" }, { status: 404 });
  }
}
