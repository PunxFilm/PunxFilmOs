import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planEntryCreateSchema, planEntryUpdateSchema } from "@/lib/validations";
import { z } from "zod";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await prisma.distributionPlan.findUnique({ where: { id: params.id } });
    if (!plan) return NextResponse.json({ error: "Piano non trovato" }, { status: 404 });

    const body = await request.json();
    const entriesSchema = z.array(planEntryCreateSchema);
    const parsed = entriesSchema.safeParse(body.entries);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const entries = await prisma.$transaction(
      parsed.data.map((entry) => {
        const { festivalEditionId, ...rest } = entry;
        return prisma.planEntry.create({
          data: {
            ...rest,
            planId: params.id,
            ...(festivalEditionId ? { festivalEditionId } : {}),
          },
        });
      })
    );

    return NextResponse.json(entries, { status: 201 });
  } catch (e) {
    console.error("Create entries error:", e);
    return NextResponse.json({ error: "Errore nella creazione delle entry" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await prisma.distributionPlan.findUnique({ where: { id: params.id } });
    if (!plan) return NextResponse.json({ error: "Piano non trovato" }, { status: 404 });

    const body = await request.json();
    const entriesSchema = z.array(planEntryUpdateSchema);
    const parsed = entriesSchema.safeParse(body.entries);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const entries = await prisma.$transaction(
      parsed.data.map((entry) =>
        prisma.planEntry.update({
          where: { id: entry.id },
          data: {
            ...(entry.status !== undefined && { status: entry.status }),
            ...(entry.position !== undefined && { position: entry.position }),
          },
        })
      )
    );

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Errore nell'aggiornamento delle entry" }, { status: 500 });
  }
}
