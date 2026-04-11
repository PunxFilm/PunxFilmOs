import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financeUpdateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const entry = await prisma.financeEntry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Movimento non trovato" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = financeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const entry = await prisma.financeEntry.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Movimento non trovato" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.financeEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Movimento non trovato" }, { status: 404 });
  }
}
