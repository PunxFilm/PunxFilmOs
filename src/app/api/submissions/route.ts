import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submissionCreateSchema } from "@/lib/validations";

export async function GET() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: { film: true, festivalEdition: { include: { festivalMaster: true } } },
  });
  return NextResponse.json(submissions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = submissionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [film, edition] = await Promise.all([
    prisma.film.findUnique({ where: { id: parsed.data.filmId } }),
    prisma.festivalEdition.findUnique({ where: { id: parsed.data.festivalEditionId } }),
  ]);
  if (!film) return NextResponse.json({ error: "Film non trovato" }, { status: 400 });
  if (!edition) return NextResponse.json({ error: "Edizione festival non trovata" }, { status: 400 });
  try {
    const submission = await prisma.submission.create({ data: parsed.data });
    return NextResponse.json(submission, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Iscrizione già esistente per questo film+edizione" }, { status: 409 });
  }
}
