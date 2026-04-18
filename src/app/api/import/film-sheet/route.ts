import { NextResponse } from "next/server";
import { parseFilmSheet } from "@/lib/import/film-sheet-parser";
import { prisma } from "@/lib/prisma";

interface ConflictFilm {
  id: string;
  titleOriginal: string;
  director: string;
  year: number;
  score: number;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const an = norm(a);
  const bn = norm(b);
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.85;
  // Shared words ratio
  const aw = new Set(an.split(" ").filter((w) => w.length > 2));
  const bw = new Set(bn.split(" ").filter((w) => w.length > 2));
  if (aw.size === 0 || bw.size === 0) return 0;
  let shared = 0;
  for (const w of aw) if (bw.has(w)) shared++;
  return shared / Math.max(aw.size, bw.size);
}

async function findConflictFilms(
  title: string | null | undefined,
  directorName: string | null | undefined
): Promise<ConflictFilm[]> {
  if (!title) return [];
  const candidates = await prisma.film.findMany({
    select: {
      id: true,
      titleOriginal: true,
      titleInternational: true,
      director: true,
      year: true,
    },
    take: 500,
  });

  const scored = candidates
    .map((f) => {
      const titleScore = Math.max(
        similarity(title, f.titleOriginal),
        f.titleInternational ? similarity(title, f.titleInternational) : 0
      );
      const dirScore = directorName
        ? similarity(directorName, f.director || "")
        : 0;
      // Combined: titolo pesa 70%, regista 30%
      const score = titleScore * 0.7 + dirScore * 0.3;
      return { ...f, score };
    })
    .filter((f) => f.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((f) => ({
    id: f.id,
    titleOriginal: f.titleOriginal,
    director: f.director,
    year: f.year,
    score: Math.round(f.score * 100) / 100,
  }));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File mancante nel campo 'file'" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filmData = await parseFilmSheet(buffer, file.name);

    const directorFullName = filmData.director
      ? `${filmData.director.firstName ?? ""} ${filmData.director.lastName ?? ""}`.trim()
      : null;

    const conflicts = await findConflictFilms(
      filmData.titleOriginal,
      directorFullName
    );

    return NextResponse.json({
      filmData,
      conflicts,
      conflictFilm: conflicts[0] ?? null,
    });
  } catch (e) {
    console.error("Film-sheet parse error:", e);
    return NextResponse.json(
      {
        error: `Errore parsing scheda film: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
