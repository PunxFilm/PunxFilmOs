import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filmCreateSchema } from "@/lib/validations";

export async function GET() {
  const films = await prisma.film.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
  return NextResponse.json(films);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = filmCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const film = await prisma.film.create({ data: parsed.data });
  return NextResponse.json(film, { status: 201 });
}
