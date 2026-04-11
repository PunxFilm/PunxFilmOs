import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: { film: true, submission: { include: { festivalEdition: { include: { festivalMaster: true } } } } },
  });
  if (!task) return NextResponse.json({ error: "Task non trovato" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const task = await prisma.task.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Task non trovato" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Task non trovato" }, { status: 404 });
  }
}
