import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  computeFilmFestivalMatch,
  type HistoricalSubmission,
} from "@/lib/film-festival-match";

export const dynamic = "force-dynamic";

// Sort keys esposti → mapping a clausole orderBy Prisma
// Nota: "compatibility" NON è qui perché viene applicato post-fetch quando filmId è set.
const SORT_MAP: Record<
  string,
  (dir: "asc" | "desc") => Prisma.FestivalEditionOrderByWithRelationInput
> = {
  name: (dir) => ({ festivalMaster: { name: dir } }),
  city: (dir) => ({ festivalMaster: { city: dir } }),
  country: (dir) => ({ festivalMaster: { country: dir } }),
  classification: (dir) => ({ festivalMaster: { classification: dir } }),
  type: (dir) => ({ festivalMaster: { type: dir } }),
  rating: (dir) => ({ festivalMaster: { punxRating: dir } }),
  quality: (dir) => ({ festivalMaster: { qualityScore: dir } }),
  verification: (dir) => ({ festivalMaster: { verificationStatus: dir } }),
  year: (dir) => ({ year: dir }),
  deadline: (dir) => ({ activeDeadlineDate: { sort: dir, nulls: "last" } }),
  fee: (dir) => ({ feeAmount: { sort: dir, nulls: "last" } }),
  prize: (dir) => ({ prizeCash: { sort: dir, nulls: "last" } }),
  eventStart: (dir) => ({ eventStartDate: { sort: dir, nulls: "last" } }),
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // --- FILTERING ---
  const search = searchParams.get("search") || "";
  const year = searchParams.get("year");
  const classification = searchParams.get("classification") || "";
  const type = searchParams.get("type") || "";
  const country = searchParams.get("country") || "";
  const qualifying = searchParams.get("qualifying") || ""; // oscar|bafta|efa|goya
  const hasDeadline = searchParams.get("hasDeadline") === "true";
  const feeMax = searchParams.get("feeMax");
  const urgency = searchParams.get("urgency") || ""; // urgent|soon|comfortable|far
  const planStatus = searchParams.get("planStatus") || ""; // planned|submitted|none
  const filmId = searchParams.get("filmId") || "";
  const onlyCompatible = searchParams.get("onlyCompatible") === "true";

  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  // --- SORTING ---
  const sortKey = searchParams.get("sort") || "deadline";
  const rawDirection = searchParams.get("direction") || "";
  const direction = rawDirection === "desc" ? "desc" : "asc";

  // "compatibility" è post-fetch. Usiamo un ordinamento fallback se richiesto
  // (la logica di sort composita viene applicata dopo il fetch).
  const isCompatibilitySort = sortKey === "compatibility";
  const orderBy: Prisma.FestivalEditionOrderByWithRelationInput[] = [];
  if (!isCompatibilitySort) {
    const sortBuilder = SORT_MAP[sortKey] || SORT_MAP.deadline;
    orderBy.push(sortBuilder(direction));
    if (sortKey !== "name") {
      orderBy.push({ festivalMaster: { name: "asc" } });
    }
  } else {
    // fallback provvisorio (verrà riordinato dopo)
    orderBy.push({ festivalMaster: { name: "asc" } });
  }

  // --- WHERE clause ---
  const masterWhere: Prisma.FestivalMasterWhereInput = { isActive: true };
  if (classification) masterWhere.classification = classification;
  if (type) masterWhere.type = type;
  if (country) masterWhere.country = country;
  if (qualifying === "oscar") masterWhere.academyQualifying = true;
  if (qualifying === "bafta") masterWhere.baftaQualifying = true;
  if (qualifying === "efa") masterWhere.efaQualifying = true;
  if (qualifying === "goya") masterWhere.goyaQualifying = true;
  if (search) {
    masterWhere.OR = [
      { name: { contains: search } },
      { name: { contains: search.toLowerCase() } },
      { name: { contains: search.charAt(0).toUpperCase() + search.slice(1) } },
      { city: { contains: search } },
      { city: { contains: search.toLowerCase() } },
      { country: { contains: search } },
    ];
  }

  const where: Prisma.FestivalEditionWhereInput = {
    festivalMaster: masterWhere,
  };

  const currentYear = new Date().getFullYear();
  if (year) {
    where.year = parseInt(year);
  } else {
    where.year = { gte: currentYear };
  }

  if (hasDeadline) {
    where.activeDeadlineDate = { gte: new Date() };
  }

  if (feeMax != null && feeMax !== "") {
    const n = parseFloat(feeMax);
    if (!isNaN(n)) {
      where.OR = [{ feeAmount: null }, { feeAmount: { lte: n } }];
    }
  }

  if (urgency) {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    let min = 0;
    let max = Number.MAX_SAFE_INTEGER;
    if (urgency === "urgent") max = 7;
    else if (urgency === "soon") {
      min = 8;
      max = 30;
    } else if (urgency === "comfortable") {
      min = 31;
      max = 90;
    } else if (urgency === "far") min = 91;

    where.activeDeadlineDate = {
      gte: new Date(now.getTime() + min * msPerDay),
      lte: new Date(now.getTime() + max * msPerDay),
    };
  }

  // Con filmId set, fetch senza limit per poter riordinare/filtrare post-processo
  // Limite di sicurezza: max 2000 edizioni (pagerà bene per 2-3 anni).
  const effectiveTake = filmId ? Math.min(2000, limit * 10) : limit;
  const effectiveSkip = filmId ? 0 : offset;

  // --- QUERY principale ---
  const [editions, total] = await Promise.all([
    prisma.festivalEdition.findMany({
      where,
      orderBy,
      take: effectiveTake,
      skip: effectiveSkip,
      select: {
        id: true,
        year: true,
        editionNumber: true,
        activeDeadlineDate: true,
        activeDeadlineType: true,
        daysToDeadline: true,
        feeAmount: true,
        feeCurrency: true,
        feeLateFee: true,
        prizeCash: true,
        prizeDescription: true,
        eventStartDate: true,
        eventEndDate: true,
        verificationStatus: true,
        premiereRules: true,
        themes: true,
        festivalMaster: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            classification: true,
            type: true,
            academyQualifying: true,
            baftaQualifying: true,
            efaQualifying: true,
            goyaQualifying: true,
            website: true,
            submissionPlatform: true,
            submissionUrlBase: true,
            contactEmailInfo: true,
            punxRating: true,
            qualityScore: true,
            maxMinutes: true,
            acceptedGenres: true,
            acceptedThemes: true,
            acceptsFirstWork: true,
          },
        },
      },
    }),
    prisma.festivalEdition.count({ where }),
  ]);

  // --- Fetch film + storico submission se filmId fornito ---
  let filmRecord: Awaited<ReturnType<typeof prisma.film.findUnique>> = null;
  let historicalSubmissions: HistoricalSubmission[] = [];
  if (filmId) {
    filmRecord = await prisma.film.findUnique({ where: { id: filmId } });
    if (filmRecord) {
      const subs = await prisma.submission.findMany({
        where: { filmId },
        select: {
          festivalEditionId: true,
          status: true,
          result: true,
          festivalEdition: {
            select: { year: true, festivalMasterId: true },
          },
        },
      });
      historicalSubmissions = subs.map((s) => ({
        festivalEditionId: s.festivalEditionId,
        festivalMasterId: s.festivalEdition.festivalMasterId,
        year: s.festivalEdition.year,
        status: s.status,
        result: s.result,
      }));
    }
  }

  // --- User context: pianificazioni e submission globali ---
  const masterIds = Array.from(new Set(editions.map((e) => e.festivalMaster.id)));
  const editionIds = editions.map((e) => e.id);
  const [planEntries, submissions] = await Promise.all([
    masterIds.length > 0
      ? prisma.planEntry.findMany({
          where: {
            festivalMasterId: { in: masterIds },
            plan: { status: { in: ["active", "draft"] } },
          },
          select: { festivalMasterId: true },
        })
      : Promise.resolve([]),
    editionIds.length > 0
      ? prisma.submission.findMany({
          where: { festivalEditionId: { in: editionIds } },
          select: { festivalEditionId: true, status: true },
        })
      : Promise.resolve([]),
  ]);
  const planMasterSet = new Set(planEntries.map((p) => p.festivalMasterId));
  const submissionMap = new Map<string, string>();
  for (const s of submissions) submissionMap.set(s.festivalEditionId, s.status);

  // --- Arricchimento ---
  let enriched = editions.map((e) => {
    const userContext = {
      hasActivePlan: planMasterSet.has(e.festivalMaster.id),
      hasSubmission: submissionMap.has(e.id),
      submissionStatus: submissionMap.get(e.id) || null,
    };

    let filmContext: ReturnType<typeof computeFilmFestivalMatch> | null = null;
    if (filmRecord) {
      filmContext = computeFilmFestivalMatch({
        film: {
          id: filmRecord.id,
          titleOriginal: filmRecord.titleOriginal,
          duration: filmRecord.duration,
          genre: filmRecord.genre,
          subgenre: filmRecord.subgenre,
          spokenLanguages: filmRecord.spokenLanguages,
          subtitleLanguages: filmRecord.subtitleLanguages,
          premiereStatus: filmRecord.premiereStatus,
          status: filmRecord.status,
        },
        master: {
          id: e.festivalMaster.id,
          name: e.festivalMaster.name,
          maxMinutes: e.festivalMaster.maxMinutes,
          acceptedGenres: e.festivalMaster.acceptedGenres,
          acceptedThemes: e.festivalMaster.acceptedThemes,
          acceptsFirstWork: e.festivalMaster.acceptsFirstWork,
        },
        edition: {
          id: e.id,
          year: e.year,
          premiereRules: e.premiereRules,
          themes: e.themes,
        },
        historicalSubmissions,
      });
    }

    // Non esporre campi non necessari al client (premiereRules/themes già usati)
    return {
      ...e,
      userContext,
      filmContext,
    };
  });

  // --- Filtri post-processo ---
  if (planStatus === "planned") {
    enriched = enriched.filter((e) => e.userContext.hasActivePlan);
  } else if (planStatus === "submitted") {
    enriched = enriched.filter((e) => e.userContext.hasSubmission);
  } else if (planStatus === "none") {
    enriched = enriched.filter(
      (e) => !e.userContext.hasActivePlan && !e.userContext.hasSubmission
    );
  }

  if (filmId && onlyCompatible) {
    enriched = enriched.filter(
      (e) => e.filmContext && e.filmContext.compatibilityLevel !== "incompatible"
    );
  }

  // --- Sort post-processo per compatibility (solo se filmId set) ---
  if (filmId && isCompatibilitySort) {
    enriched.sort((a, b) => {
      const sa = a.filmContext?.compatibilityScore ?? -1;
      const sb = b.filmContext?.compatibilityScore ?? -1;
      return direction === "desc" ? sb - sa : sa - sb;
    });
  }

  // --- Pagination post-fetch se filmId ---
  let totalFiltered = total;
  if (filmId) {
    totalFiltered = enriched.length;
    enriched = enriched.slice(offset, offset + limit);
  }

  return NextResponse.json({
    editions: enriched,
    total: totalFiltered,
    film: filmRecord
      ? {
          id: filmRecord.id,
          titleOriginal: filmRecord.titleOriginal,
          duration: filmRecord.duration,
          genre: filmRecord.genre,
          premiereStatus: filmRecord.premiereStatus,
          status: filmRecord.status,
        }
      : null,
  });
}
