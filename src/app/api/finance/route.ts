import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financeCreateSchema } from "@/lib/validations";

export async function GET() {
  const entries = await prisma.financeEntry.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = financeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const entry = await prisma.financeEntry.create({ data: parsed.data });
  return NextResponse.json(entry, { status: 201 });
}
