import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const aw = new Set(an.split(" ").filter((w) => w.length > 2));
  const bw = new Set(bn.split(" ").filter((w) => w.length > 2));
  if (aw.size === 0 || bw.size === 0) return 0;
  let shared = 0;
  for (const w of aw) if (bw.has(w)) shared++;
  return shared / Math.max(aw.size, bw.size);
}

export async function POST(request: Request) {
  try {
    const { title, director } = (await request.json()) as {
      title?: string;
      director?: string;
    };

    if (!title && !director) {
      return NextResponse.json(
        { error: "Fornire almeno 'title' o 'director'" },
        { status: 400 }
      );
    }

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
        const titleScore = title
          ? Math.max(
              similarity(title, f.titleOriginal),
              f.titleInternational ? similarity(title, f.titleInternational) : 0
            )
          : 0;
        const dirScore = director ? similarity(director, f.director || "") : 0;
        const score = title && director
          ? titleScore * 0.7 + dirScore * 0.3
          : Math.max(titleScore, dirScore);
        return { ...f, score };
      })
      .filter((f) => f.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({
      matches: scored.map((f) => ({
        id: f.id,
        titleOriginal: f.titleOriginal,
        director: f.director,
        year: f.year,
        score: Math.round(f.score * 100) / 100,
      })),
    });
  } catch (e) {
    console.error("Film check existing error:", e);
    return NextResponse.json(
      { error: "Errore nel controllo duplicati" },
      { status: 500 }
    );
  }
}
