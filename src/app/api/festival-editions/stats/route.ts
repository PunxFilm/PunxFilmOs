import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [urgentCount, oscarOpenCount, freeEntryCount, budgetAggregate] =
    await Promise.all([
      // Deadline attive nei prossimi 7 giorni
      prisma.festivalEdition.count({
        where: {
          festivalMaster: { isActive: true },
          activeDeadlineDate: { gte: now, lte: in7days },
        },
      }),
      // Oscar qualifying con almeno un'edizione con deadline futura
      prisma.festivalEdition.count({
        where: {
          festivalMaster: { isActive: true, academyQualifying: true },
          activeDeadlineDate: { gte: now },
        },
      }),
      // Free entry con deadline futura
      prisma.festivalEdition.count({
        where: {
          festivalMaster: { isActive: true },
          activeDeadlineDate: { gte: now },
          OR: [{ feeAmount: null }, { feeAmount: 0 }],
        },
      }),
      // Budget pianificato: somma estimatedFee da PlanEntry in piani attivi/draft
      prisma.planEntry.aggregate({
        _sum: { estimatedFee: true },
        where: {
          plan: { status: { in: ["active", "draft"] } },
        },
      }),
    ]);

  return NextResponse.json({
    urgentCount,
    oscarOpenCount,
    freeEntryCount,
    budgetPlanned: budgetAggregate._sum.estimatedFee || 0,
  });
}
