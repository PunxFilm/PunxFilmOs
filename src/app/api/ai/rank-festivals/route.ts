import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL, MAX_TOKENS, parseAIResponse } from "@/lib/ai";
import { buildFestivalRankingPrompt } from "@/lib/ai-prompts";

export async function POST(request: Request) {
  try {
    const { filmId, premiereLevel } = await request.json();
    if (!filmId || !premiereLevel) {
      return NextResponse.json({ error: "filmId e premiereLevel obbligatori" }, { status: 400 });
    }

    const film = await prisma.film.findUnique({ where: { id: filmId } });
    if (!film) return NextResponse.json({ error: "Film non trovato" }, { status: 404 });

    // Fetch festival masters attivi con tipo compatibile
    const masters = await prisma.festivalMaster.findMany({
      where: { isActive: true },
      include: { editions: { where: { year: { gte: new Date().getFullYear() } }, orderBy: { year: "desc" }, take: 1 } },
    });

    // Filtra festival con almeno un'edizione e con durata compatibile
    const compatible = masters.filter((m) => {
      if (m.maxMinutes && film.duration > m.maxMinutes) return false;
      return true;
    });

    if (compatible.length === 0) {
      return NextResponse.json({ rankings: [] });
    }

    // Prepara dati per AI (max 15 festival per mantenere il JSON nella finestra output)
    const top = compatible.slice(0, 15);

    const { system, user } = buildFestivalRankingPrompt(
      {
        title: film.titleOriginal, director: film.director, year: film.year,
        duration: film.duration, genre: film.genre, country: film.country,
        language: film.spokenLanguages || "Italiano",
        synopsis: film.synopsisShortIt || film.synopsisLongIt,
      },
      top.map((m) => {
        const ed = m.editions[0];
        return {
          id: m.id, name: m.name, country: m.country, city: m.city,
          category: m.classification || "international",
          deadlineGeneral: ed?.deadlineGeneral?.toISOString() || null,
          feesAmount: ed?.feeAmount || null,
          specialization: m.type || m.focus,
          acceptedFormats: m.acceptedGenres,
          durationMin: null, durationMax: m.maxMinutes,
          themes: m.acceptedThemes,
          premiereRequirement: ed?.premiereRules || null,
          festivalStartDate: ed?.eventStartDate?.toISOString() || null,
          festivalEndDate: ed?.eventEndDate?.toISOString() || null,
          selectionHistory: m.punxHistory || null,
          acceptedLanguages: null,
          // Extra per priorità A/B/C
          academyQualifying: m.academyQualifying,
          hasCashPrize: (ed?.prizeCash || 0) > 0,
          waiverType: m.waiverType,
          waiverCode: ed?.waiverCode || null,
        };
      }),
      premiereLevel
    );

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
      rankings: { festivalId: string; score: number; reasoning: string; warnings: string[] }[];
    }>(content.text);

    // Arricchisci con priorità A/B/C e dati waiver
    const enriched = result.rankings.map((r) => {
      const master = top.find((m) => m.id === r.festivalId);
      const ed = master?.editions[0];
      let priority = "C";
      if (master) {
        const isAList = master.classification === "A" || (master.qualityScore && master.qualityScore >= 80);
        if (isAList || master.academyQualifying || (ed?.prizeCash && ed.prizeCash > 0)) {
          priority = "A";
        } else if (r.score >= 60) {
          priority = "B";
        }
      }
      return {
        ...r,
        priority,
        festivalName: master?.name || "Sconosciuto",
        festivalCity: master?.city || "",
        festivalCountry: master?.country || "",
        classification: master?.classification || "",
        type: master?.type || "",
        academyQualifying: master?.academyQualifying || false,
        waiverType: master?.waiverType || "none",
        waiverCode: ed?.waiverCode || null,
        feeAmount: ed?.feeAmount || null,
        feeCurrency: ed?.feeCurrency || "USD",
        deadlineGeneral: ed?.deadlineGeneral?.toISOString() || null,
        eventStartDate: ed?.eventStartDate?.toISOString() || null,
        editionId: ed?.id || null,
        editionYear: ed?.year || null,
        prizeCash: ed?.prizeCash || null,
      };
    });

    return NextResponse.json({ rankings: enriched });
  } catch (e) {
    console.error("AI rank-festivals error:", e);
    return NextResponse.json({ error: "Errore nel ranking AI. Riprova." }, { status: 500 });
  }
}
