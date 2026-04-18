import { NextResponse } from "next/server";
import { matchFestivals as matchFestivalsNew } from "@/lib/import/festival-matcher";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint matching festival — supporta due shape di request:
 *  - nuovo: { names: string[] } → { matches: FestivalMatch[] }
 *  - legacy: { festivals: [{ name, id? }] } → { matches: [...] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let names: string[] = [];
    let originalIds: (string | null)[] = [];
    let shape: "new" | "legacy" = "new";

    if (Array.isArray(body?.names)) {
      names = body.names.filter((n: unknown): n is string => typeof n === "string");
      originalIds = names.map(() => null);
      shape = "new";
    } else if (Array.isArray(body?.festivals)) {
      names = body.festivals.map((f: { name: string }) => f.name);
      originalIds = body.festivals.map(
        (f: { id?: string }) => f.id ?? null
      );
      shape = "legacy";
    } else {
      return NextResponse.json(
        { error: "Richiesto 'names' (string[]) o 'festivals' ([{name,id?}])" },
        { status: 400 }
      );
    }

    if (names.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const matches = await matchFestivalsNew(names, prisma);

    if (shape === "legacy") {
      // Retro-compatibilità con formato legacy che il vecchio wizard si aspetta
      const legacy = matches.map((m, i) => {
        const top = m.matches[0];
        return {
          festivalMasterId: top?.festivalMasterId ?? null,
          festivalName: m.query,
          matchedName: top?.name ?? null,
          confidence:
            top == null
              ? ("none" as const)
              : top.confidence >= 0.95
                ? ("exact" as const)
                : ("fuzzy" as const),
          score: top ? Math.round(top.confidence * 100) : 0,
          originalId: originalIds[i],
        };
      });
      return NextResponse.json({ matches: legacy, results: legacy });
    }

    return NextResponse.json({ matches });
  } catch (e) {
    console.error("Match festivals error:", e);
    return NextResponse.json(
      { error: "Errore nel matching dei festival" },
      { status: 500 }
    );
  }
}
