import { NextResponse } from "next/server";
import { matchFestivals } from "@/lib/festival-matcher";

export async function POST(request: Request) {
  try {
    const { festivals } = await request.json();

    if (!festivals || !Array.isArray(festivals) || festivals.length === 0) {
      return NextResponse.json(
        { error: "Il campo 'festivals' deve essere un array non vuoto" },
        { status: 400 }
      );
    }

    const festivalNames = festivals.map((f: { name: string; id?: string }) => f.name);
    const results = await matchFestivals(festivalNames);

    // Merge back any original IDs provided by the caller
    const enriched = results.map((r, i) => ({
      ...r,
      originalId: festivals[i]?.id || null,
    }));

    return NextResponse.json({ matches: enriched });
  } catch (e) {
    console.error("Match festivals error:", e);
    return NextResponse.json(
      { error: "Errore nel matching dei festival" },
      { status: 500 }
    );
  }
}
