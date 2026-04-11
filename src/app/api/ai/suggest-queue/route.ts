import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL, MAX_TOKENS, parseAIResponse } from "@/lib/ai";
import { buildQueueSuggestionsPrompt } from "@/lib/ai-prompts";

export async function POST(request: Request) {
  try {
    const { filmId, premiereFestivalId } = await request.json();
    if (!filmId || !premiereFestivalId) {
      return NextResponse.json({ error: "filmId e premiereFestivalId obbligatori" }, { status: 400 });
    }

    const film = await prisma.film.findUnique({ where: { id: filmId } });
    if (!film) return NextResponse.json({ error: "Film non trovato" }, { status: 404 });

    const premiereMaster = await prisma.festivalMaster.findUnique({
      where: { id: premiereFestivalId },
      include: { editions: { where: { year: { gte: new Date().getFullYear() } }, orderBy: { year: "desc" }, take: 1 } },
    });
    if (!premiereMaster) return NextResponse.json({ error: "Festival premiere non trovato" }, { status: 404 });

    const premiereEd = premiereMaster.editions[0];
    const premiereEndDate = premiereEd?.eventEndDate || premiereEd?.eventStartDate || premiereEd?.deadlineGeneral;

    // Fetch tutti i festival master attivi escluso la premiere
    const allMasters = await prisma.festivalMaster.findMany({
      where: { isActive: true, id: { not: premiereFestivalId } },
      include: { editions: { where: { year: { gte: new Date().getFullYear() } }, orderBy: { year: "desc" }, take: 1 } },
    });

    // Filtro temporale + durata compatibile
    const available = allMasters.filter((m) => {
      if (m.maxMinutes && film.duration > m.maxMinutes) return false;
      if (!premiereEndDate) return true;
      const ed = m.editions[0];
      const festDate = ed?.eventStartDate || ed?.deadlineGeneral;
      if (!festDate) return true;
      return new Date(festDate) > new Date(premiereEndDate);
    });

    if (available.length === 0) {
      return NextResponse.json({ queue: [] });
    }

    const top = available.slice(0, 15);

    const toFestivalData = (m: typeof allMasters[0]) => {
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
      };
    };

    const premiereFestData = toFestivalData(premiereMaster);

    const { system, user } = buildQueueSuggestionsPrompt(
      {
        title: film.titleOriginal, director: film.director, year: film.year,
        duration: film.duration, genre: film.genre, country: film.country,
        language: film.spokenLanguages || "Italiano",
        synopsis: film.synopsisShortIt || film.synopsisLongIt,
      },
      premiereFestData,
      top.map(toFestivalData)
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
      queue: { festivalId: string; score: number; reasoning: string; warnings: string[] }[];
    }>(content.text);

    // Arricchisci con priorità e dati
    const enriched = result.queue.map((r) => {
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

    return NextResponse.json({ queue: enriched });
  } catch (e) {
    console.error("AI suggest-queue error:", e);
    return NextResponse.json({ error: "Errore nei suggerimenti AI. Riprova." }, { status: 500 });
  }
}
