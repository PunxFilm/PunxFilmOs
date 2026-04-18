import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  filmId: z.string().min(1, "filmId obbligatorio"),
  editionIds: z.array(z.string()).min(1, "Almeno un editionId"),
  premiereLevel: z
    .enum(["world", "international", "european", "national"])
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { filmId, editionIds } = parsed.data;
    const premiereLevel = parsed.data.premiereLevel || "international";

    // 1. Verifica film
    const film = await prisma.film.findUnique({ where: { id: filmId } });
    if (!film) {
      return NextResponse.json(
        { error: "Film non trovato" },
        { status: 404 }
      );
    }

    // 2. Trova (o crea) piano attivo/draft per il film
    let plan = await prisma.distributionPlan.findFirst({
      where: { filmId, status: { in: ["active", "draft"] } },
      orderBy: { createdAt: "desc" },
      include: { entries: true },
    });

    let planCreated = false;
    if (!plan) {
      plan = await prisma.distributionPlan.create({
        data: {
          filmId,
          premiereLevel,
          status: "draft",
        },
        include: { entries: true },
      });
      planCreated = true;
    }

    // 3. Fetch edizioni richieste + masterId
    const editions = await prisma.festivalEdition.findMany({
      where: { id: { in: editionIds } },
      select: {
        id: true,
        festivalMasterId: true,
        feeAmount: true,
      },
    });

    // 4. Determina posizione di partenza (max position + 1)
    const existingMasterIds = new Set(
      plan.entries.map((e) => e.festivalMasterId)
    );
    let nextPosition =
      plan.entries.reduce((max, e) => Math.max(max, e.position), -1) + 1;

    // 5. Filtra edizioni non duplicate: skip quelle con master già nel piano
    //    E dedupla la batch stessa (es. 2 edizioni dello stesso master selezionate).
    const seenMasters = new Set<string>(existingMasterIds);
    const toCreate: typeof editions = [];
    for (const ed of editions) {
      if (seenMasters.has(ed.festivalMasterId)) continue;
      seenMasters.add(ed.festivalMasterId);
      toCreate.push(ed);
    }
    const skipped = editions.length - toCreate.length;

    // 6. Crea entries in batch via transaction
    if (toCreate.length > 0) {
      await prisma.$transaction(
        toCreate.map((ed) =>
          prisma.planEntry.create({
            data: {
              planId: plan!.id,
              festivalMasterId: ed.festivalMasterId,
              festivalEditionId: ed.id,
              role: "queue",
              position: nextPosition++,
              status: "pending",
              estimatedFee: ed.feeAmount || 0,
            },
          })
        )
      );
    }

    return NextResponse.json(
      {
        planId: plan.id,
        planCreated,
        added: toCreate.length,
        skipped,
        filmTitle: film.titleOriginal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk add to plan error:", error);
    return NextResponse.json(
      { error: "Errore interno durante l'aggiunta al piano" },
      { status: 500 }
    );
  }
}
