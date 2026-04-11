import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { distributionPlanCreateSchema } from "@/lib/validations";

export async function GET() {
  const plans = await prisma.distributionPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      film: true,
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
  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = distributionPlanCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const film = await prisma.film.findUnique({ where: { id: parsed.data.filmId } });
  if (!film) return NextResponse.json({ error: "Film non trovato" }, { status: 400 });

  const plan = await prisma.distributionPlan.create({ data: parsed.data });
  return NextResponse.json(plan, { status: 201 });
}
