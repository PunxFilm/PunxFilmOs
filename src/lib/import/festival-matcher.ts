import type { PrismaClient } from "@prisma/client";

export interface FestivalMatchCandidate {
  festivalMasterId: string;
  name: string;
  country: string | null;
  confidence: number; // 0..1
}

export interface FestivalMatch {
  query: string;
  matches: FestivalMatchCandidate[];
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuovi accenti
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // togli punteggiatura
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Distanza di Levenshtein classica, DP 2-row memory.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function levRatio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const d = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - d / maxLen;
}

// Minimal Prisma shape needed for querying festivals
type PrismaLike = Pick<PrismaClient, "festivalMaster">;

export async function matchFestivals(
  names: string[],
  prisma: PrismaLike
): Promise<FestivalMatch[]> {
  const masters = await prisma.festivalMaster.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      canonicalName: true,
      country: true,
    },
  });

  const prepared = masters.map((m) => {
    const candidates = [m.name];
    if (m.canonicalName) candidates.push(m.canonicalName);
    return {
      id: m.id,
      name: m.name,
      country: m.country ?? null,
      normalizedList: candidates.map(normalizeName).filter((s) => s.length > 0),
    };
  });

  return names.map((query) => {
    const qNorm = normalizeName(query);
    if (!qNorm) {
      return { query, matches: [] };
    }

    const scored: FestivalMatchCandidate[] = [];
    for (const m of prepared) {
      let best = 0;
      for (const mNorm of m.normalizedList) {
        if (mNorm === qNorm) {
          best = Math.max(best, 1.0);
          continue;
        }
        if (mNorm.includes(qNorm) || qNorm.includes(mNorm)) {
          // Contains: 0.85 base, penalizza se c'è molta differenza di lunghezza
          const minLen = Math.min(mNorm.length, qNorm.length);
          const maxLen = Math.max(mNorm.length, qNorm.length);
          const containsScore = 0.85 * (0.6 + 0.4 * (minLen / maxLen));
          best = Math.max(best, containsScore);
          continue;
        }
        const ratio = levRatio(qNorm, mNorm);
        if (ratio > 0.75) {
          best = Math.max(best, ratio);
        }
      }
      if (best > 0) {
        scored.push({
          festivalMasterId: m.id,
          name: m.name,
          country: m.country,
          confidence: Math.round(best * 100) / 100,
        });
      }
    }

    scored.sort((a, b) => b.confidence - a.confidence);
    return { query, matches: scored.slice(0, 3) };
  });
}
