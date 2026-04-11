import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { festivalUpdateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const festival = await prisma.festival.findUnique({
    where: { id: params.id },
    include: { submissions: { include: { film: true } }, strategies: { include: { film: true } }, _count: { select: { submissions: true } } },
  });
  if (!festival) return NextResponse.json({ error: "Festival non trovato" }, { status: 404 });
  return NextResponse.json(festival);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = festivalUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const festival = await prisma.festival.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(festival);
  } catch {
    return NextResponse.json({ error: "Festival non trovato" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.festival.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Festival non trovato" }, { status: 404 });
  }
}
