/**
 * Core reusable: calcola e aggiorna activeDeadlineType, activeDeadlineDate,
 * daysToDeadline su tutte le FestivalEdition.
 *
 * Chiamato da:
 *  - scripts/fill-active-deadlines.ts (CLI locale / railway run)
 *  - src/app/api/cron/fill-deadlines/route.ts (GitHub Actions daily cron)
 */
import type { PrismaClient } from "@prisma/client";
import { computeActiveDeadlineFields } from "./deadline-helpers";

export interface FillDeadlinesStats {
  total: number;
  updated: number;
  cleared: number;
  skipped: number;
  urgency: {
    urgent: number;
    soon: number;
    comfortable: number;
    far: number;
    past: number;
  };
  durationMs: number;
}

export async function fillActiveDeadlines(
  prisma: PrismaClient,
  referenceDate: Date = new Date()
): Promise<FillDeadlinesStats> {
  const started = Date.now();

  const editions = await prisma.festivalEdition.findMany({
    select: {
      id: true,
      deadlineEarly: true,
      deadlineGeneral: true,
      deadlineLate: true,
      deadlineFinal: true,
      activeDeadlineType: true,
      activeDeadlineDate: true,
    },
  });

  let updated = 0;
  let cleared = 0;
  let skipped = 0;
  const urgency = { urgent: 0, soon: 0, comfortable: 0, far: 0, past: 0 };

  for (const e of editions) {
    const fields = computeActiveDeadlineFields(e, referenceDate);

    if (fields.daysToDeadline == null) urgency.past++;
    else if (fields.daysToDeadline <= 7) urgency.urgent++;
    else if (fields.daysToDeadline <= 30) urgency.soon++;
    else if (fields.daysToDeadline <= 90) urgency.comfortable++;
    else urgency.far++;

    const currentTypeKey = e.activeDeadlineType || null;
    const currentDateMs = e.activeDeadlineDate ? e.activeDeadlineDate.getTime() : null;
    const newDateMs = fields.activeDeadlineDate ? fields.activeDeadlineDate.getTime() : null;

    if (currentTypeKey === fields.activeDeadlineType && currentDateMs === newDateMs) {
      skipped++;
      continue;
    }

    await prisma.festivalEdition.update({
      where: { id: e.id },
      data: fields,
    });

    if (fields.activeDeadlineDate) updated++;
    else cleared++;
  }

  return {
    total: editions.length,
    updated,
    cleared,
    skipped,
    urgency,
    durationMs: Date.now() - started,
  };
}
