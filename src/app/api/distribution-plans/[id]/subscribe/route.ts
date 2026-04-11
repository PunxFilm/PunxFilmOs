import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { entryId, feesPaid, platform, waiverApplied, waiverCode } = await request.json();
    if (!entryId || feesPaid === undefined) {
      return NextResponse.json({ error: "entryId e feesPaid obbligatori" }, { status: 400 });
    }

    const entry = await prisma.planEntry.findUnique({
      where: { id: entryId },
      include: {
        plan: { include: { film: true } },
        festivalMaster: true,
        festivalEdition: true,
      },
    });
    if (!entry) return NextResponse.json({ error: "Entry non trovata" }, { status: 404 });
    if (entry.planId !== params.id) {
      return NextResponse.json({ error: "Entry non appartiene a questo piano" }, { status: 400 });
    }
    if (!entry.festivalEditionId) {
      return NextResponse.json({ error: "Nessuna edizione associata. Seleziona un'edizione prima di iscriverti." }, { status: 400 });
    }

    // Transazione atomica
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          filmId: entry.plan.filmId,
          festivalEditionId: entry.festivalEditionId!,
          status: "draft",
          feesPaid,
          waiverApplied: waiverApplied || false,
          waiverCode: waiverCode || null,
          platform: platform || null,
        },
      });

      await tx.financeEntry.create({
        data: {
          type: "expense",
          category: "submission_fee",
          amount: feesPaid,
          date: new Date(),
          description: `Iscrizione ${entry.festivalMaster.name}${entry.festivalEdition ? ` ${entry.festivalEdition.year}` : ""}`,
          filmTitle: entry.plan.film.titleOriginal,
          festivalName: entry.festivalMaster.name,
        },
      });

      const updatedEntry = await tx.planEntry.update({
        where: { id: entryId },
        data: {
          status: "subscribed",
          submissionId: submission.id,
          actualFee: feesPaid,
          waiverApplied: waiverApplied || false,
          waiverCode: waiverCode || null,
        },
      });

      return { submission, entry: updatedEntry };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("Subscribe error:", e);
    return NextResponse.json({ error: "Errore nell'iscrizione. Potrebbe già esistere un'iscrizione per questo film+edizione." }, { status: 500 });
  }
}
