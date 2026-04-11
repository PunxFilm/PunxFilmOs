import { prisma } from "@/lib/prisma";

interface MatchResult {
  festivalMasterId: string | null;
  festivalName: string;
  matchedName: string | null;
  confidence: "exact" | "fuzzy" | "none";
  score: number; // 0-100
}

export async function matchFestivals(festivalNames: string[]): Promise<MatchResult[]> {
  const allMasters = await prisma.festivalMaster.findMany({
    where: { isActive: true },
    select: { id: true, name: true, base44Id: true, city: true, country: true },
  });

  return festivalNames.map((name) => {
    // 1. Exact match
    const exact = allMasters.find(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    );
    if (exact) return { festivalMasterId: exact.id, festivalName: name, matchedName: exact.name, confidence: "exact" as const, score: 100 };

    // 2. Contains match (one contains the other)
    const contains = allMasters.find(
      (m) => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase())
    );
    if (contains) return { festivalMasterId: contains.id, festivalName: name, matchedName: contains.name, confidence: "fuzzy" as const, score: 80 };

    // 3. Word-based fuzzy match
    const nameWords = name.toLowerCase().split(/[\s\-\u2013\u2014]+/).filter(w => w.length > 2);
    let bestMatch: typeof allMasters[0] | null = null;
    let bestScore = 0;

    for (const m of allMasters) {
      const masterWords = m.name.toLowerCase().split(/[\s\-\u2013\u2014]+/).filter(w => w.length > 2);
      const commonWords = nameWords.filter(w => masterWords.some(mw => mw.includes(w) || w.includes(mw)));
      const score = (commonWords.length / Math.max(nameWords.length, masterWords.length)) * 100;
      if (score > bestScore && score >= 50) {
        bestScore = score;
        bestMatch = m;
      }
    }

    if (bestMatch) {
      return { festivalMasterId: bestMatch.id, festivalName: name, matchedName: bestMatch.name, confidence: "fuzzy" as const, score: Math.round(bestScore) };
    }

    return { festivalMasterId: null, festivalName: name, matchedName: null, confidence: "none" as const, score: 0 };
  });
}
