import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submissionUpdateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { film: true, festivalEdition: { include: { festivalMaster: true } }, tasks: true },
  });
  if (!submission) return NextResponse.json({ error: "Iscrizione non trovata" }, { status: 404 });
  return NextResponse.json(submission);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = submissionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const submission = await prisma.submission.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(submission);
  } catch {
    return NextResponse.json({ error: "Iscrizione non trovata" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.submission.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Iscrizione non trovata" }, { status: 404 });
  }
}
