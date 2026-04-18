import { NextResponse } from "next/server";
import { parseStrategySheet, type StrategyRow } from "@/lib/import/xlsx-parser";
import { parsePdfStrategy } from "@/lib/import/pdf-strategy-parser";
import { matchFestivals } from "@/lib/import/festival-matcher";
import { findDuplicateSubmissions } from "@/lib/import/dedup";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const filmId = formData.get("filmId");
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
      rows = await parsePdfStrategy(buffer, "submissions");
    } else {
      return NextResponse.json(
        { error: `Formato file non supportato: ${file.name}` },
        { status: 400 }
      );
    }

    // Matching festival
    const names = rows.map((r) => r.festivalName);
    const matches = await matchFestivals(names, prisma);

    // Dedup — solo se filmId fornito
    let duplicates: Awaited<ReturnType<typeof findDuplicateSubmissions>> = [];
    if (typeof filmId === "string" && filmId) {
      const proposed = rows
        .map((r, i) => {
          const best = matches[i]?.matches[0];
          if (!best) return null;
          return {
            festivalMasterId: best.festivalMasterId,
            festivalName: r.festivalName,
            status: r.status,
            feesPaid: r.feesPaid,
            listPrice: r.listPrice,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);

      duplicates = await findDuplicateSubmissions(filmId, proposed, prisma);
    }

    // Enrichi righe con matches per la UI
    const enrichedRows = rows.map((r, i) => ({
      ...r,
      matches: matches[i]?.matches ?? [],
    }));

    return NextResponse.json({ rows: enrichedRows, duplicates });
  } catch (e) {
    console.error("Submissions import error:", e);
    return NextResponse.json(
      {
        error: `Errore import iscrizioni: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
