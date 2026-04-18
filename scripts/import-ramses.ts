#!/usr/bin/env tsx
/**
 * import-ramses.ts — importa Film "Ramses" e tutte le sue Submissions.
 *
 * Workflow:
 *   1. Carica dati da scripts/data/ramses-strategy.ts
 *   2. Deduplica submissions per (festivalName normalizzato, eventYear)
 *   3. Fuzzy-match nome festival → FestivalMaster (riutilizza src/lib/festival-matcher.ts)
 *   4. Trova FestivalEdition per (masterId, year). Se non esiste, report e skip.
 *   5. Upsert Film "Ramses" (chiave naturale: titleOriginal + year + director)
 *   6. Upsert Submission (chiave: [filmId, festivalEditionId])
 *   7. Report finale: creati / aggiornati / non matchati / edizione mancante
 *
 * USAGE:
 *   npx tsx scripts/import-ramses.ts                     # dry-run (default)
 *   npx tsx scripts/import-ramses.ts --apply             # scrive davvero
 *   npx tsx scripts/import-ramses.ts --apply --verbose   # con log dettagliati
 *
 * ENV:
 *   DATABASE_URL   — Postgres Railway
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { RAMSES_META, RAMSES_SUBMISSIONS, type RawSubmission, type SheetStatus } from "./data/ramses-strategy";

const args = new Set(process.argv.slice(2));
const DRY_RUN = !args.has("--apply");
const VERBOSE = args.has("--verbose");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────

const ITALIAN_MONTHS: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};

function parseDDMMYYYY(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(d.getTime()) ? null : d;
}

function parseItalianDate(s?: string): { date: Date | null; year: number | null } {
  if (!s) return { date: null, year: null };
  // Es: "17 marzo 2025", "5 marzo 2026", "28 novembre 2026"
  const m = s.trim().match(/(\d{1,2})\s+([a-zà]+)\s+(\d{4})/i);
  if (!m) {
    // fallback: trova solo l'anno
    const y = s.match(/\b(20\d{2})\b/);
    return { date: null, year: y ? Number(y[1]) : null };
  }
  const [, dd, monthName, yyyy] = m;
  const month = ITALIAN_MONTHS[monthName.toLowerCase()];
  if (!month) return { date: null, year: Number(yyyy) };
  return { date: new Date(Number(yyyy), month - 1, Number(dd)), year: Number(yyyy) };
}

function normalizeFestivalName(s: string): string {
  return s.toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9\s\-]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapStatus(raw: SheetStatus): { status: string; result: string | null } {
  switch (raw) {
    case "Not Selected": return { status: "rejected", result: null };
    case "Selected":     return { status: "accepted", result: "official_selection" };
    case "Award Winner": return { status: "accepted", result: "award" };
    case "Undecided":    return { status: "submitted", result: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Festival matching (inline, evita dipendenza @/lib)
// ─────────────────────────────────────────────────────────────────────────────

type MasterRow = {
  id: string;
  name: string;
  country: string;
  city: string;
};

interface MatchResult {
  festivalMasterId: string | null;
  festivalName: string;
  matchedName: string | null;
  matchedCountry: string | null;
  confidence: "exact" | "strong" | "fuzzy" | "none";
  score: number;
}

function matchOne(name: string, masters: MasterRow[], hintCountry?: string): MatchResult {
  const nameNorm = normalizeFestivalName(name);

  // 1. Match esatto (normalizzato)
  let exact = masters.find((m) => normalizeFestivalName(m.name) === nameNorm);
  if (exact) return { festivalMasterId: exact.id, festivalName: name, matchedName: exact.name, matchedCountry: exact.country, confidence: "exact", score: 100 };

  // 2. Match contains (uno contiene l'altro) — ma con preferenza per lunghezza simile
  const candidates = masters.filter((m) => {
    const mn = normalizeFestivalName(m.name);
    return mn.includes(nameNorm) || nameNorm.includes(mn);
  });
  if (candidates.length > 0) {
    // se hintCountry è dato, preferisci match con stesso country
    const byCountry = hintCountry ? candidates.find((c) => c.country?.toLowerCase() === hintCountry.toLowerCase()) : null;
    const pick = byCountry ?? candidates.sort((a, b) => Math.abs(a.name.length - name.length) - Math.abs(b.name.length - name.length))[0];
    return { festivalMasterId: pick.id, festivalName: name, matchedName: pick.name, matchedCountry: pick.country, confidence: "strong", score: 85 };
  }

  // 3. Word-based fuzzy (≥ 50% parole significative in comune)
  const nameWords = nameNorm.split(/\s+/).filter((w) => w.length > 2);
  let best: { master: MasterRow; score: number } | null = null;
  for (const m of masters) {
    const mWords = normalizeFestivalName(m.name).split(/\s+/).filter((w) => w.length > 2);
    if (mWords.length === 0 || nameWords.length === 0) continue;
    const common = nameWords.filter((w) => mWords.some((mw) => mw === w || mw.includes(w) || w.includes(mw)));
    const score = (common.length / Math.max(nameWords.length, mWords.length)) * 100;
    if (score >= 55 && (!best || score > best.score)) {
      best = { master: m, score };
    }
  }
  if (best) {
    return { festivalMasterId: best.master.id, festivalName: name, matchedName: best.master.name, matchedCountry: best.master.country, confidence: "fuzzy", score: Math.round(best.score) };
  }

  return { festivalMasterId: null, festivalName: name, matchedName: null, matchedCountry: null, confidence: "none", score: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("─".repeat(70));
  console.log(DRY_RUN ? "🔍 DRY-RUN — nessuna scrittura sul DB" : "✍️  MODALITÀ APPLY — scrittura abilitata");
  console.log("─".repeat(70));

  // ─── 1. Carica tutti i FestivalMaster attivi ──────────────────────────────
  const masters = await prisma.festivalMaster.findMany({
    where: { isActive: true },
    select: { id: true, name: true, country: true, city: true },
  });
  console.log(`\n📚 FestivalMaster attivi nel DB: ${masters.length}`);
  if (masters.length === 0) {
    console.error("⚠️  Nessun festival in DB. L'import non può procedere.");
    process.exit(1);
  }

  // ─── 2. Dedup submissions per (festivalName, eventYear) ────────────────────
  const dedup = new Map<string, RawSubmission>();
  for (const raw of RAMSES_SUBMISSIONS) {
    const { year: eventYear } = parseItalianDate(raw.festivalEventDateRaw);
    const key = `${normalizeFestivalName(raw.festivalName)}|${eventYear ?? "?"}`;
    const existing = dedup.get(key);
    if (!existing) {
      dedup.set(key, raw);
      continue;
    }
    // Collisione: preferisci status definitivo (non Undecided)
    const prefer = existing.status === "Undecided" && raw.status !== "Undecided" ? raw : existing;
    dedup.set(key, prefer);
    if (VERBOSE) console.log(`  (dedup) ${raw.festivalName} [${eventYear}] collisione → tengo ${prefer.status}`);
  }
  const submissions = Array.from(dedup.values());
  console.log(`📋 Submissions uniche dopo dedup: ${submissions.length} (input: ${RAMSES_SUBMISSIONS.length})`);

  // ─── 3. Match festival + lookup edition ────────────────────────────────────
  type Row = {
    raw: RawSubmission;
    match: MatchResult;
    eventYear: number | null;
    festivalEditionId: string | null;
    editionError?: string;
  };

  const rows: Row[] = [];
  for (const raw of submissions) {
    const { year: eventYear } = parseItalianDate(raw.festivalEventDateRaw);
    const match = matchOne(raw.festivalName, masters, raw.country);
    let festivalEditionId: string | null = null;
    let editionError: string | undefined;

    if (match.festivalMasterId && eventYear) {
      const edition = await prisma.festivalEdition.findUnique({
        where: { festivalMasterId_year: { festivalMasterId: match.festivalMasterId, year: eventYear } },
        select: { id: true },
      });
      if (edition) {
        festivalEditionId = edition.id;
      } else {
        editionError = `edizione ${eventYear} mancante`;
      }
    } else if (!eventYear) {
      editionError = "eventYear non deducibile";
    }

    rows.push({ raw, match, eventYear, festivalEditionId, editionError });
  }

  // ─── 4. Report matching ────────────────────────────────────────────────────
  const byConfidence = {
    exact:  rows.filter((r) => r.match.confidence === "exact"),
    strong: rows.filter((r) => r.match.confidence === "strong"),
    fuzzy:  rows.filter((r) => r.match.confidence === "fuzzy"),
    none:   rows.filter((r) => r.match.confidence === "none"),
  };
  const readyToImport = rows.filter((r) => r.festivalEditionId);
  const noEdition = rows.filter((r) => r.match.festivalMasterId && !r.festivalEditionId);

  console.log("\n🎯 MATCHING FESTIVAL:");
  console.log(`  Exact    : ${byConfidence.exact.length}`);
  console.log(`  Strong   : ${byConfidence.strong.length}  (contains match)`);
  console.log(`  Fuzzy    : ${byConfidence.fuzzy.length}  (word-based ≥ 55%)`);
  console.log(`  Non trovati: ${byConfidence.none.length}`);
  console.log(`  ─`);
  console.log(`  ✅ Pronti all'import         : ${readyToImport.length}`);
  console.log(`  ⚠️  Master ok ma edizione KO : ${noEdition.length}`);
  console.log(`  ❌ Master non matchato       : ${byConfidence.none.length}`);

  if (VERBOSE || byConfidence.fuzzy.length > 0) {
    console.log("\n🔎 Fuzzy matches (da verificare):");
    for (const r of byConfidence.fuzzy) {
      console.log(`    ${r.match.score}% │ "${r.raw.festivalName}" → "${r.match.matchedName}" (${r.match.matchedCountry})`);
    }
  }

  if (byConfidence.none.length > 0) {
    console.log("\n❌ Festival non trovati in DB:");
    for (const r of byConfidence.none) {
      console.log(`    - "${r.raw.festivalName}" (${r.raw.country ?? "?"})`);
    }
  }

  if (noEdition.length > 0) {
    console.log("\n⚠️  Festival matchati ma edizione mancante:");
    for (const r of noEdition) {
      console.log(`    - "${r.match.matchedName}" anno ${r.eventYear} non esiste → ${r.editionError}`);
    }
  }

  if (DRY_RUN) {
    console.log("\n─".repeat(70).slice(0, 70));
    console.log("👀 DRY-RUN: nessuna scrittura. Per eseguire l'import:");
    console.log("   npx tsx scripts/import-ramses.ts --apply");
    return;
  }

  // ─── 5. Upsert Film "Ramses" ───────────────────────────────────────────────
  const existingFilm = await prisma.film.findFirst({
    where: {
      titleOriginal: RAMSES_META.titleOriginal,
      year: RAMSES_META.year,
      director: RAMSES_META.director,
    },
  });

  const filmData: Prisma.FilmUncheckedCreateInput = {
    titleOriginal: RAMSES_META.titleOriginal,
    director: RAMSES_META.director,
    year: RAMSES_META.year,
    duration: RAMSES_META.duration,
    genre: RAMSES_META.genre,
    subgenre: RAMSES_META.subgenre,
    country: RAMSES_META.country,
    spokenLanguages: RAMSES_META.spokenLanguages,
    subtitleLanguages: RAMSES_META.subtitleLanguages,
    synopsisLongIt: RAMSES_META.synopsisLongIt,
    cast: RAMSES_META.cast,
    crew: RAMSES_META.crew,
    screenwriters: RAMSES_META.screenwriters,
    producers: RAMSES_META.producers,
    ownerEmail: RAMSES_META.ownerEmail,
    tags: RAMSES_META.tags,
    status: "in_distribuzione",
  };

  let film;
  if (existingFilm) {
    film = await prisma.film.update({ where: { id: existingFilm.id }, data: filmData });
    console.log(`\n📼 Film "Ramses" aggiornato (id=${film.id})`);
  } else {
    film = await prisma.film.create({ data: filmData });
    console.log(`\n📼 Film "Ramses" creato (id=${film.id})`);
  }

  // ─── 6. Upsert Submissions ─────────────────────────────────────────────────
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const row of readyToImport) {
    try {
      const { status, result } = mapStatus(row.raw.status);
      const notificationDate = parseDDMMYYYY(row.raw.notificationDate);
      const { date: festivalEventDate } = parseItalianDate(row.raw.festivalEventDateRaw);
      const deadline = parseDDMMYYYY(row.raw.deadline);

      // submittedAt: usiamo la data della deadline come approssimazione se status != Undecided
      // (le submissions sono tutte state inviate entro la deadline)
      const submittedAt = row.raw.status !== "Undecided" && deadline ? deadline : null;

      const data: Prisma.SubmissionUncheckedCreateInput = {
        filmId: film.id,
        festivalEditionId: row.festivalEditionId!,
        status,
        result: result ?? undefined,
        platform: row.raw.platform,
        submittedAt: submittedAt ?? undefined,
        estimatedFee: row.raw.originalFee ?? undefined,
        feesPaid: row.raw.paidFee ?? undefined,
        notificationDate: notificationDate ?? undefined,
        festivalEventDate: festivalEventDate ?? undefined,
        prizeAmount: row.raw.status === "Award Winner" ? (row.raw.prize ?? row.raw.paidFee) : undefined,
        notes: [
          row.raw.prizeReason ? `Premio: ${row.raw.prizeReason}` : null,
          row.raw.notes ?? null,
          row.raw.legacyId ? `legacy-id: ${row.raw.legacyId}` : null,
        ].filter(Boolean).join(" | ") || undefined,
      };

      const result_ = await prisma.submission.upsert({
        where: { filmId_festivalEditionId: { filmId: film.id, festivalEditionId: row.festivalEditionId! } },
        update: data,
        create: data,
      });

      // Sapere se è create o update richiede una query in più; confrontiamo createdAt vs updatedAt
      const isNew = Math.abs(result_.createdAt.getTime() - result_.updatedAt.getTime()) < 1000;
      if (isNew) created++; else updated++;

      if (VERBOSE) {
        console.log(`  ${isNew ? "➕" : "🔄"} ${row.match.matchedName} ${row.eventYear} → ${status}${result ? ` (${result})` : ""}`);
      }
    } catch (e) {
      failed++;
      console.error(`  ❌ Errore su "${row.raw.festivalName}":`, (e as Error).message);
    }
  }

  console.log("\n✅ IMPORT COMPLETATO:");
  console.log(`  Submissions create   : ${created}`);
  console.log(`  Submissions aggiornate: ${updated}`);
  console.log(`  Errori               : ${failed}`);
  console.log(`  Non importate (no edition/master): ${noEdition.length + byConfidence.none.length}`);
}

main()
  .catch((e) => {
    console.error("\n💥 ERRORE FATALE:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
