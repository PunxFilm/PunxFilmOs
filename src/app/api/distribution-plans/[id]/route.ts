import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { distributionPlanUpdateSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const plan = await prisma.distributionPlan.findUnique({
    where: { id: params.id },
    include: {
      film: { include: { materials: true } },
      entries: {
        include: {
          festivalMaster: true,
          festivalEdition: true,
          submission: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!plan) return NextResponse.json({ error: "Piano non trovato" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = distributionPlanUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const plan = await prisma.distributionPlan.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Piano non trovato" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.distributionPlan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Piano non trovato" }, { status: 404 });
  }
}
