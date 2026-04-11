import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { festivalCreateSchema } from "@/lib/validations";

export async function GET() {
  const festivals = await prisma.festival.findMany({
    orderBy: { deadlineGeneral: "asc" },
    include: { _count: { select: { submissions: true } } },
  });
  return NextResponse.json(festivals);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = festivalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const festival = await prisma.festival.create({ data: parsed.data });
  return NextResponse.json(festival, { status: 201 });
}
