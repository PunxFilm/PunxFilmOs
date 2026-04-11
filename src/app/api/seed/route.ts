import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Pulisci tutto
  await prisma.task.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.planEntry.deleteMany();
  await prisma.distributionPlan.deleteMany();
  await prisma.financeEntry.deleteMany();
  await prisma.film.deleteMany();
  await prisma.festival.deleteMany();

  // Film
  const films = await Promise.all([
    prisma.film.create({
      data: { title: "L'Ultimo Treno", director: "Marco Ferretti", year: 2025, duration: 98, genre: "Drammatico", country: "Italia", language: "Italiano", synopsis: "Un viaggio notturno attraverso l'Italia che cambia la vita di tre sconosciuti.", status: "active" },
    }),
    prisma.film.create({
      data: { title: "Nuvole di Carta", director: "Sofia Conti", year: 2025, duration: 22, genre: "Cortometraggio", country: "Italia", language: "Italiano", synopsis: "Una bambina costruisce un mondo di carta per sfuggire alla realtà.", status: "active" },
    }),
    prisma.film.create({
      data: { title: "Beneath the Surface", director: "Luca Moretti", year: 2024, duration: 112, genre: "Thriller", country: "Italia", language: "Italiano/Inglese", synopsis: "Un giornalista indaga su un caso di corruzione che lo porta sempre più in profondità.", status: "active" },
    }),
    prisma.film.create({
      data: { title: "Ritorno a Casa", director: "Anna Bianchi", year: 2024, duration: 88, genre: "Documentario", country: "Italia", language: "Italiano", synopsis: "Tre famiglie emigrate tornano nei loro paesi d'origine.", status: "archived" },
    }),
  ]);

  // Festival (enriched with new fields)
  const now = new Date();
  const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const festivals = await Promise.all([
    prisma.festival.create({
      data: {
        name: "Festival di Venezia", country: "Italia", city: "Venezia", category: "A-list",
        deadlineGeneral: addDays(5), feesAmount: 0, website: "https://labiennale.org",
        specialization: "general", acceptedFormats: "feature,documentary",
        durationMin: 60, durationMax: 240, themes: "autore,sociale,sperimentale",
        premiereRequirement: "world_premiere",
        festivalStartDate: addDays(60), festivalEndDate: addDays(71),
        selectionHistory: "Premiato Leone d'Oro a opere italiane nel 2023 e 2024",
        acceptedLanguages: "any",
      },
    }),
    prisma.festival.create({
      data: {
        name: "Torino Film Festival", country: "Italia", city: "Torino", category: "B-list",
        deadlineGeneral: addDays(12), feesAmount: 25, website: "https://torinofilmfest.org",
        specialization: "general", acceptedFormats: "feature,short,documentary",
        durationMin: 1, durationMax: 240, themes: "giovani autori,indipendente",
        premiereRequirement: "national_premiere",
        festivalStartDate: addDays(90), festivalEndDate: addDays(98),
        selectionHistory: "Focus su cinema indipendente e nuovi autori",
        acceptedLanguages: "any",
      },
    }),
    prisma.festival.create({
      data: {
        name: "Locarno Film Festival", country: "Svizzera", city: "Locarno", category: "A-list",
        deadlineGeneral: addDays(30), feesAmount: 0,
        specialization: "general", acceptedFormats: "feature,short",
        durationMin: 1, durationMax: 240, themes: "autore,sperimentale,avanguardia",
        premiereRequirement: "international_premiere",
        festivalStartDate: addDays(75), festivalEndDate: addDays(85),
        selectionHistory: "Pardo d'Oro a cinema d'autore europeo e asiatico",
        acceptedLanguages: "any",
      },
    }),
    prisma.festival.create({
      data: {
        name: "Clermont-Ferrand", country: "Francia", city: "Clermont-Ferrand", category: "A-list",
        deadlineGeneral: addDays(45), feesAmount: 15, notes: "Specializzato in cortometraggi",
        specialization: "shorts", acceptedFormats: "short",
        durationMin: 1, durationMax: 40, themes: "tutti i generi",
        premiereRequirement: "none",
        festivalStartDate: addDays(120), festivalEndDate: addDays(128),
        selectionHistory: "Il più importante festival di cortometraggi al mondo",
        acceptedLanguages: "any",
      },
    }),
    prisma.festival.create({
      data: {
        name: "Festival dei Popoli", country: "Italia", city: "Firenze", category: "Niche",
        deadlineGeneral: addDays(8), feesAmount: 10, notes: "Festival del documentario",
        specialization: "documentary", acceptedFormats: "feature,documentary",
        durationMin: 15, durationMax: 180, themes: "sociale,diritti umani,antropologia",
        premiereRequirement: "none",
        festivalStartDate: addDays(50), festivalEndDate: addDays(57),
        selectionHistory: "Uno dei più antichi festival del documentario in Europa",
        acceptedLanguages: "Italian,English",
      },
    }),
    prisma.festival.create({
      data: {
        name: "Festa del Cinema di Roma", country: "Italia", city: "Roma", category: "A-list",
        deadlineGeneral: addDays(60), feesAmount: 0,
        specialization: "general", acceptedFormats: "feature,documentary",
        durationMin: 60, durationMax: 240, themes: "autore,mainstream",
        premiereRequirement: "international_premiere",
        festivalStartDate: addDays(100), festivalEndDate: addDays(110),
        selectionHistory: "Apertura al cinema di genere e mainstream d'autore",
        acceptedLanguages: "any",
      },
    }),
    prisma.festival.create({
      data: {
        name: "Cortinametraggio", country: "Italia", city: "Cortina d'Ampezzo", category: "Regional",
        deadlineGeneral: addDays(3), feesAmount: 20,
        specialization: "shorts", acceptedFormats: "short",
        durationMin: 1, durationMax: 30, themes: "tutti i generi",
        premiereRequirement: "none",
        festivalStartDate: addDays(40), festivalEndDate: addDays(44),
        selectionHistory: "Festival regionale dedicato ai cortometraggi italiani",
        acceptedLanguages: "Italian",
      },
    }),
    prisma.festival.create({
      data: {
        name: "Sundance Film Festival", country: "USA", city: "Park City", category: "A-list",
        deadlineGeneral: addDays(90), feesAmount: 75,
        specialization: "general", acceptedFormats: "feature,short,documentary",
        durationMin: 1, durationMax: 240, themes: "indipendente,sociale,innovazione",
        premiereRequirement: "world_premiere",
        festivalStartDate: addDays(150), festivalEndDate: addDays(160),
        selectionHistory: "Il più importante festival del cinema indipendente americano",
        acceptedLanguages: "any",
      },
    }),
  ]);

  // Distribution Plan for "L'Ultimo Treno"
  const plan = await prisma.distributionPlan.create({
    data: {
      filmId: films[0].id,
      premiereLevel: "world",
      status: "active",
      aiAnalysis: JSON.stringify({
        strengths: ["Forte narrativa drammatica", "Ambientazione italiana autentica", "Durata adatta a festival A-list"],
        weaknesses: ["Primo film del regista"],
        suggestedStrategy: "Puntare a premiere mondiale a Venezia, poi circuito europeo A-list",
      }),
    },
  });

  await Promise.all([
    prisma.planEntry.create({
      data: {
        planId: plan.id,
        festivalId: festivals[0].id, // Venezia - premiere
        role: "premiere",
        position: 0,
        status: "approved",
        matchScore: 85,
        matchReasoning: "Film drammatico italiano forte, perfetto per la Mostra del Cinema. Durata e genere ideali per la competizione principale.",
      },
    }),
    prisma.planEntry.create({
      data: {
        planId: plan.id,
        festivalId: festivals[2].id, // Locarno
        role: "queue",
        position: 1,
        status: "approved",
        matchScore: 72,
        matchReasoning: "Locarno apprezza il cinema d'autore europeo. Ottima alternativa se Venezia non accetta.",
      },
    }),
    prisma.planEntry.create({
      data: {
        planId: plan.id,
        festivalId: festivals[1].id, // Torino
        role: "queue",
        position: 2,
        status: "pending",
        matchScore: 65,
        matchReasoning: "Torino Film Festival ha un focus su giovani autori italiani. Buona visibilità nazionale.",
      },
    }),
    prisma.planEntry.create({
      data: {
        planId: plan.id,
        festivalId: festivals[5].id, // Roma
        role: "queue",
        position: 3,
        status: "pending",
        matchScore: 60,
        matchReasoning: "Festa del Cinema di Roma offre visibilità al pubblico generalista. Da valutare come opzione complementare.",
      },
    }),
  ]);

  // Submissions
  await Promise.all([
    prisma.submission.create({ data: { filmId: films[0].id, festivalId: festivals[0].id, status: "submitted", platform: "direct", submittedAt: addDays(-10), feesPaid: 0 } }),
    prisma.submission.create({ data: { filmId: films[1].id, festivalId: festivals[6].id, status: "draft", platform: "FilmFreeway" } }),
    prisma.submission.create({ data: { filmId: films[2].id, festivalId: festivals[7].id, status: "submitted", platform: "FilmFreeway", submittedAt: addDays(-5), feesPaid: 75 } }),
    prisma.submission.create({ data: { filmId: films[3].id, festivalId: festivals[4].id, status: "accepted", platform: "direct", submittedAt: addDays(-30), feesPaid: 10, result: "official_selection" } }),
  ]);

  // Tasks
  await Promise.all([
    prisma.task.create({ data: { title: "Preparare DCP per Venezia", status: "in_progress", priority: "high", dueDate: addDays(3), filmId: films[0].id } }),
    prisma.task.create({ data: { title: "Completare iscrizione Cortinametraggio", status: "todo", priority: "medium", dueDate: addDays(2), filmId: films[1].id } }),
    prisma.task.create({ data: { title: "Aggiornare sottotitoli inglesi", status: "todo", priority: "high", dueDate: addDays(5), filmId: films[2].id } }),
    prisma.task.create({ data: { title: "Preparare materiali stampa Festival dei Popoli", status: "todo", priority: "medium", dueDate: addDays(7), filmId: films[3].id } }),
    prisma.task.create({ data: { title: "Revisione budget Q2 distribuzione", status: "todo", priority: "low", dueDate: addDays(14) } }),
    prisma.task.create({ data: { title: "Contattare agente vendite internazionali", status: "in_progress", priority: "high", dueDate: addDays(1) } }),
  ]);

  // Finance
  await Promise.all([
    prisma.financeEntry.create({ data: { type: "expense", category: "submission_fee", amount: 75, date: addDays(-5), description: "Iscrizione Sundance", filmTitle: "Beneath the Surface", festivalName: "Sundance" } }),
    prisma.financeEntry.create({ data: { type: "expense", category: "submission_fee", amount: 10, date: addDays(-30), description: "Iscrizione Festival dei Popoli", filmTitle: "Ritorno a Casa", festivalName: "Festival dei Popoli" } }),
    prisma.financeEntry.create({ data: { type: "expense", category: "travel", amount: 1200, date: addDays(-15), description: "Volo + hotel Firenze per Festival dei Popoli" } }),
    prisma.financeEntry.create({ data: { type: "income", category: "screening_fee", amount: 500, date: addDays(-20), description: "Fee proiezione Festival dei Popoli", filmTitle: "Ritorno a Casa" } }),
    prisma.financeEntry.create({ data: { type: "income", category: "award", amount: 3000, date: addDays(-25), description: "Premio miglior documentario", filmTitle: "Ritorno a Casa" } }),
    prisma.financeEntry.create({ data: { type: "expense", category: "other", amount: 350, date: addDays(-2), description: "Stampa poster e materiale promozionale" } }),
  ]);

  return NextResponse.json({ ok: true, message: "Dati demo caricati con successo" });
}
