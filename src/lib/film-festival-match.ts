/**
 * Calcolo deterministico di compatibilità film–festival.
 * Usato da /api/festival-editions quando query param filmId è presente.
 * Pura, testabile, senza chiamate DB/AI.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type PremiereLevel = "world" | "international" | "european" | "national" | "none";

export type MatchLevel = "full" | "partial" | "none";

export type CompatibilityLevel =
  | "best"
  | "good"
  | "ok"
  | "warning"
  | "incompatible";

export interface Warning {
  severity: "info" | "warn" | "block";
  message: string;
}

export interface FilmInput {
  id: string;
  titleOriginal: string;
  duration: number; // minuti
  genre: string | null;
  subgenre: string | null;
  spokenLanguages: string | null;
  subtitleLanguages: string | null;
  premiereStatus: string | null; // "world_premiere" | ... | null
  status: string | null;
}

export interface MasterInput {
  id: string;
  name: string;
  maxMinutes: number | null;
  acceptedGenres: string | null;
  acceptedThemes: string | null;
  acceptsFirstWork: boolean | null;
}

export interface EditionInput {
  id: string;
  year: number;
  premiereRules: string | null;
  themes: string | null;
}

export interface HistoricalSubmission {
  festivalEditionId: string;
  festivalMasterId: string;
  year: number;
  status: string;
  result: string | null;
}

export interface FilmContext {
  durationCompatible: boolean;
  genreMatch: MatchLevel;
  themeMatch: MatchLevel;
  premiereRequired: PremiereLevel | null;
  premiereConflict: boolean;
  alreadySubmittedThisEdition: boolean;
  previouslySubmittedToMaster: Array<{
    year: number;
    status: string;
    result: string | null;
  }>;
  compatibilityScore: number; // 0-100
  compatibilityLevel: CompatibilityLevel;
  warnings: Warning[];
}

// ─────────────────────────────────────────────
// Helpers: parsing & normalization
// ─────────────────────────────────────────────

function splitCSV(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[,;|]/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Estrae la PremiereLevel richiesta dall'edition.premiereRules (testo libero).
 * null = sconosciuto / no warning.
 */
export function parsePremiereRequirement(
  rules: string | null | undefined
): PremiereLevel | null {
  if (!rules) return null;
  const r = rules.toLowerCase();

  if (/\b(no premiere|premiere not required|any premiere|non richiesta)\b/.test(r)) {
    return "none";
  }
  if (/\bworld[\s-]?premiere\b/.test(r)) return "world";
  if (/\binternational[\s-]?premiere\b/.test(r)) return "international";
  if (/\beuropean[\s-]?premiere\b/.test(r)) return "european";
  if (/\bnational[\s-]?premiere\b/.test(r)) return "national";
  return null;
}

/**
 * Normalizza film.premiereStatus (es. "world_premiere", "national_premiere") a PremiereLevel.
 */
export function normalizeFilmPremiereStatus(
  status: string | null | undefined
): PremiereLevel | null {
  if (!status) return null;
  const s = status.toLowerCase().replace(/[_\s-]premiere/, "");
  if (s === "world") return "world";
  if (s === "international") return "international";
  if (s === "european") return "european";
  if (s === "national") return "national";
  return null;
}

const PREMIERE_HIERARCHY: Record<PremiereLevel, number> = {
  world: 4,
  international: 3,
  european: 2,
  national: 1,
  none: 0,
};

/**
 * Il film ha già "consumato" un premiere ≥ di quello richiesto dal festival?
 */
export function hasPremiereConflict(
  filmPremiere: PremiereLevel | null,
  festivalRequires: PremiereLevel | null
): boolean {
  if (!festivalRequires || festivalRequires === "none") return false;
  if (!filmPremiere) return false; // film mai submittato → tutti i premiere disponibili
  return PREMIERE_HIERARCHY[filmPremiere] >= PREMIERE_HIERARCHY[festivalRequires];
}

/**
 * Match set-intersection su liste normalizzate.
 * "full" se al meno un match esatto, "partial" se contains, "none" altrimenti.
 */
function matchCategories(
  filmTokens: string[],
  acceptedTokens: string[]
): MatchLevel {
  if (acceptedTokens.length === 0) return "none"; // no info dal festival → non è un match positivo
  if (filmTokens.length === 0) return "none";

  let hasFull = false;
  let hasPartial = false;

  for (const ft of filmTokens) {
    for (const at of acceptedTokens) {
      if (ft === at) hasFull = true;
      else if (ft.includes(at) || at.includes(ft)) hasPartial = true;
    }
  }

  if (hasFull) return "full";
  if (hasPartial) return "partial";
  return "none";
}

// ─────────────────────────────────────────────
// Main computation
// ─────────────────────────────────────────────

export interface ComputeInput {
  film: FilmInput;
  master: MasterInput;
  edition: EditionInput;
  historicalSubmissions: HistoricalSubmission[];
}

export function computeFilmFestivalMatch({
  film,
  master,
  edition,
  historicalSubmissions,
}: ComputeInput): FilmContext {
  const warnings: Warning[] = [];

  // Durata
  const durationCompatible =
    master.maxMinutes == null || film.duration <= master.maxMinutes;
  if (!durationCompatible && master.maxMinutes != null) {
    warnings.push({
      severity: "block",
      message: `⛔ Durata ${Math.round(film.duration)}min > max festival ${master.maxMinutes}min`,
    });
  }

  // Genre match
  const filmGenreTokens = [
    ...splitCSV(film.genre),
    ...splitCSV(film.subgenre),
  ];
  const masterGenreTokens = splitCSV(master.acceptedGenres);
  const genreMatch = matchCategories(filmGenreTokens, masterGenreTokens);
  if (genreMatch === "none" && masterGenreTokens.length > 0 && filmGenreTokens.length > 0) {
    warnings.push({
      severity: "warn",
      message: `⚠️ Genere "${filmGenreTokens[0]}" non nelle categorie accettate (${masterGenreTokens.slice(0, 3).join(", ")})`,
    });
  }

  // Theme match (usa sia master.acceptedThemes che edition.themes)
  const masterThemeTokens = [
    ...splitCSV(master.acceptedThemes),
    ...splitCSV(edition.themes),
  ];
  const themeMatch = matchCategories(filmGenreTokens, masterThemeTokens);
  if (themeMatch === "full") {
    warnings.push({
      severity: "info",
      message: "💡 Match tematico pieno",
    });
  }

  // Premiere
  const premiereRequired = parsePremiereRequirement(edition.premiereRules);
  const filmPremiere = normalizeFilmPremiereStatus(film.premiereStatus);
  const premiereConflict = hasPremiereConflict(filmPremiere, premiereRequired);
  if (premiereConflict && premiereRequired && filmPremiere) {
    warnings.push({
      severity: "warn",
      message: `⚠️ Richiede ${premiereRequired} premiere, il film ha già fatto ${filmPremiere}`,
    });
  }

  // Already submitted
  const alreadySubmittedThisEdition = historicalSubmissions.some(
    (s) => s.festivalEditionId === edition.id
  );
  const previouslySubmittedToMaster = historicalSubmissions
    .filter(
      (s) =>
        s.festivalMasterId === master.id && s.festivalEditionId !== edition.id
    )
    .map((s) => ({ year: s.year, status: s.status, result: s.result }));

  if (alreadySubmittedThisEdition) {
    const sub = historicalSubmissions.find(
      (s) => s.festivalEditionId === edition.id
    );
    warnings.push({
      severity: "block",
      message: `⛔ Già submittato (${edition.year}, status: ${sub?.status || "?"}${sub?.result ? ` · ${sub.result}` : ""})`,
    });
  } else if (previouslySubmittedToMaster.length > 0) {
    const history = previouslySubmittedToMaster
      .map((s) => `${s.year} ${s.status}`)
      .join(", ");
    warnings.push({
      severity: "info",
      message: `ℹ️ Storia con questo festival: ${history}`,
    });
  }

  // Film non pronto
  if (film.status === "archived") {
    warnings.push({
      severity: "warn",
      message: "⚠️ Film archiviato",
    });
  } else if (film.status === "onboarding") {
    warnings.push({
      severity: "info",
      message: "ℹ️ Film in onboarding (materiali incompleti)",
    });
  }

  // Score composito
  let score = 50; // base
  if (durationCompatible) score += 30;
  else score -= 50;

  if (genreMatch === "full") score += 25;
  else if (genreMatch === "partial") score += 15;

  if (themeMatch === "full") score += 15;
  else if (themeMatch === "partial") score += 8;

  // Lingua (best-effort: se film ha english subtitle, assume OK per la maggior parte)
  const hasEnglishSubs =
    film.subtitleLanguages?.toLowerCase().includes("english") ||
    film.subtitleLanguages?.toLowerCase().includes("inglese");
  if (hasEnglishSubs) score += 10;

  if (alreadySubmittedThisEdition) score -= 50;
  if (premiereConflict) score -= 30;

  // First work bonus
  if (master.acceptsFirstWork === true) {
    // heuristica: se il film ha status "onboarding" o year recente (proxy debole)
    const currentYear = new Date().getFullYear();
    if (film.status === "onboarding" || film.status === "in_distribuzione") {
      // non possiamo sapere se è un esordio solo dal DB senza filmografia regista
      // quindi non diamo bonus automatico, è troppo speculativo
    }
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Level bucket
  let compatibilityLevel: CompatibilityLevel;
  if (alreadySubmittedThisEdition || !durationCompatible) {
    compatibilityLevel = "incompatible";
    score = 0;
  } else if (score >= 85) {
    compatibilityLevel = "best";
    warnings.unshift({
      severity: "info",
      message: "⭐ Miglior match per durata e categoria",
    });
  } else if (score >= 65) {
    compatibilityLevel = "good";
  } else if (score >= 40) {
    compatibilityLevel = "ok";
  } else if (score > 0) {
    compatibilityLevel = "warning";
  } else {
    compatibilityLevel = "incompatible";
  }

  return {
    durationCompatible,
    genreMatch,
    themeMatch,
    premiereRequired,
    premiereConflict,
    alreadySubmittedThisEdition,
    previouslySubmittedToMaster,
    compatibilityScore: score,
    compatibilityLevel,
    warnings,
  };
}
