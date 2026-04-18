import type { PrismaClient } from "@prisma/client";

export interface ProposedSubmission {
  festivalMasterId: string;
  festivalName: string;
  status?: string | null;
  feesPaid?: number | null;
  listPrice?: number | null;
}

export interface DuplicateInfo {
  festivalMasterId: string;
  festivalName: string;
  existingSubmissionId: string;
  existingStatus: string;
  existingFeesPaid: number | null;
  existingListPrice: number | null;
  proposedStatus: string | null;
  proposedFeesPaid: number | null;
  proposedListPrice: number | null;
}

type PrismaLike = Pick<PrismaClient, "submission">;

export async function findDuplicateSubmissions(
  filmId: string,
  proposed: ProposedSubmission[],
  prisma: PrismaLike
): Promise<DuplicateInfo[]> {
  if (!filmId || proposed.length === 0) return [];

  const festivalMasterIds = Array.from(
    new Set(proposed.map((p) => p.festivalMasterId).filter(Boolean))
  );
  if (festivalMasterIds.length === 0) return [];

  const existingSubs = await prisma.submission.findMany({
    where: {
      filmId,
      festivalEdition: {
        festivalMasterId: { in: festivalMasterIds },
      },
    },
    select: {
      id: true,
      status: true,
      feesPaid: true,
      listPrice: true,
      festivalEdition: {
        select: {
          festivalMasterId: true,
        },
      },
    },
  });

  // Mappa masterId -> existing submission (prende la prima per masterId)
  const byMasterId = new Map<string, (typeof existingSubs)[number]>();
  for (const sub of existingSubs) {
    const mid = sub.festivalEdition?.festivalMasterId;
    if (mid && !byMasterId.has(mid)) {
      byMasterId.set(mid, sub);
    }
  }

  const duplicates: DuplicateInfo[] = [];
  for (const p of proposed) {
    const existing = byMasterId.get(p.festivalMasterId);
    if (!existing) continue;
    duplicates.push({
      festivalMasterId: p.festivalMasterId,
      festivalName: p.festivalName,
      existingSubmissionId: existing.id,
      existingStatus: existing.status,
      existingFeesPaid: existing.feesPaid ?? null,
      existingListPrice: existing.listPrice ?? null,
      proposedStatus: p.status ?? null,
      proposedFeesPaid: p.feesPaid ?? null,
      proposedListPrice: p.listPrice ?? null,
    });
  }

  return duplicates;
}
