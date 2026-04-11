import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL, MAX_TOKENS, parseAIResponse } from "@/lib/ai";
import { buildFilmAnalysisPrompt } from "@/lib/ai-prompts";

export async function POST(request: Request) {
  try {
    const { filmId } = await request.json();
    if (!filmId) return NextResponse.json({ error: "filmId obbligatorio" }, { status: 400 });

    const film = await prisma.film.findUnique({
      where: { id: filmId },
      include: { materials: true },
    });
    if (!film) return NextResponse.json({ error: "Film non trovato" }, { status: 404 });

    // Calcola stato materiali
    const totalMaterials = film.materials.length;
    const uploadedMaterials = film.materials.filter((m) => m.status !== "missing").length;
    const materialProgress = totalMaterials > 0 ? Math.round((uploadedMaterials / totalMaterials) * 100) : 0;

    const { system, user } = buildFilmAnalysisPrompt({
      title: film.titleOriginal,
      director: film.director,
      year: film.year,
      duration: film.duration,
      genre: film.genre,
      country: film.country,
      language: film.spokenLanguages || "Italiano",
      synopsis: film.synopsisShortIt || film.synopsisLongIt,
    });

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Risposta AI non valida" }, { status: 500 });
    }

    const result = parseAIResponse<{
      premiereLevel: string;
      reasoning: string;
      keyStrengths: string[];
      targetAudience: string;
    }>(content.text);

    return NextResponse.json({
      ...result,
      materialProgress,
      totalMaterials,
      uploadedMaterials,
    });
  } catch (e) {
    console.error("AI analyze-film error:", e);
    return NextResponse.json({ error: "Errore nell'analisi AI. Riprova." }, { status: 500 });
  }
}
