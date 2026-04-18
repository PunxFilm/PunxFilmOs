import { NextResponse } from "next/server";
import { parseStrategySheet, type StrategyRow } from "@/lib/import/xlsx-parser";
import { parsePdfStrategy } from "@/lib/import/pdf-strategy-parser";
import { matchFestivals } from "@/lib/import/festival-matcher";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const sheetNamesRaw = formData.getAll("sheetNames");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File mancante" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const lower = file.name.toLowerCase();
    let rows: StrategyRow[] = [];

    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      const sheetNames = sheetNamesRaw.map((s) => String(s)).filter(Boolean);
      if (sheetNames.length === 0) {
        return NextResponse.json(
          { error: "Specificare 'sheetNames' per file Excel" },
          { status: 400 }
        );
      }
      for (const name of sheetNames) {
        try {
          const sheetRows = parseStrategySheet(buffer, name);
          rows.push(...sheetRows);
        } catch (err) {
          console.warn(`Skipping sheet ${name}:`, err);
        }
      }
    } else if (lower.endsWith(".pdf")) {
      rows = await parsePdfStrategy(buffer, "queue");
    } else {
      return NextResponse.json(
        { error: `Formato file non supportato: ${file.name}` },
        { status: 400 }
      );
    }

    const names = rows.map((r) => r.festivalName);
    const matches = await matchFestivals(names, prisma);

    const enrichedRows = rows.map((r, i) => ({
      ...r,
      matches: matches[i]?.matches ?? [],
    }));

    return NextResponse.json({ rows: enrichedRows });
  } catch (e) {
    console.error("Queue import error:", e);
    return NextResponse.json(
      {
        error: `Errore import coda: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
