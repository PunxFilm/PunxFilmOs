/**
 * Enrich delle FestivalEdition 2026 senza deadline.
 *
 * Per ogni edizione 2026 con tutte le 4 deadline a NULL, chiede a Claude
 * (con tool web_search) di cercare la pagina ufficiale / FilmFreeway e
 * restituire le deadline in JSON strutturato. Scrive solo le date trovate,
 * lascia NULL quelle non confermate. Poi ricalcola activeDeadline.
 *
 * Usage:
 *   DATABASE_URL=<prod_postgres_public_url> \
 *   ANTHROPIC_API_KEY=<key> \
 *   npx tsx scripts/enrich-deadlines-2026.ts [--limit=30] [--dry-run]
 *
 * Flags:
 *   --limit=N   massimo N edizioni (default 30)
 *   --dry-run   non scrive su DB, stampa solo cosa farebbe
 *   --year=YYYY override anno (default 2026)
 */
import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { fillActiveDeadlines } from "../src/lib/fill-deadlines-core";

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const args = process.argv.slice(2);
const getFlag = (name: string, def?: string) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : def;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

const LIMIT = parseInt(getFlag("limit", "30") || "30", 10);
const YEAR = parseInt(getFlag("year", "2026") || "2026", 10);
const DRY_RUN = hasFlag("dry-run");

interface DeadlineSearchResult {
  deadlineEarly: string | null; // ISO yyyy-mm-dd o null
  deadlineGeneral: string | null;
  deadlineLate: string | null;
  deadlineFinal: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  sourceUrl: string | null;
  confidence: "high" | "medium" | "low";
  notes: string;
}

const SYSTEM_PROMPT = `Sei un assistente che recupera deadline di festival di cortometraggi.
Usa il tool web_search per trovare la pagina ufficiale del festival (FilmFreeway, sito ufficiale) per l'anno richiesto.
Restituisci SOLO un JSON valido con questa shape esatta (nessun testo fuori dal JSON, nessun markdown fence):
{
  "deadlineEarly": "YYYY-MM-DD" | null,
  "deadlineGeneral": "YYYY-MM-DD" | null,
  "deadlineLate": "YYYY-MM-DD" | null,
  "deadlineFinal": "YYYY-MM-DD" | null,
  "eventStartDate": "YYYY-MM-DD" | null,
  "eventEndDate": "YYYY-MM-DD" | null,
  "sourceUrl": "https://..." | null,
  "confidence": "high" | "medium" | "low",
  "notes": "breve nota in italiano"
}
Regole:
- Metti null dove non trovi certezza. MAI inventare date.
- "confidence": high se pagina ufficiale conferma, medium se fonte terza affidabile, low se incerto.
- Se il festival non ha ancora aperto le iscrizioni per l'anno richiesto, TUTTI i campi deadline a null e notes="non ancora aperto".`;

function extractJson(text: string): string | null {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return cleaned.slice(start, end + 1);
}

async function searchDeadlines(
  festivalName: string,
  country: string | null,
  year: number
): Promise<DeadlineSearchResult | null> {
  const userMsg = `Festival: "${festivalName}"${country ? ` (paese: ${country})` : ""}
Anno edizione: ${year}
Trova le deadline di submission (early / general / late / final) e le date dell'evento per l'edizione ${year}.
Preferisci FilmFreeway.com e il sito ufficiale del festival.`;

  try {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 4,
        } as unknown as Anthropic.Tool,
      ],
      messages: [{ role: "user", content: userMsg }],
    });

    const textBlock = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const json = extractJson(textBlock);
    if (!json) {
      console.warn(`  ⚠️  No JSON in response for "${festivalName}"`);
      return null;
    }
    return JSON.parse(json) as DeadlineSearchResult;
  } catch (e) {
    console.warn(`  ⚠️  API error for "${festivalName}":`, e instanceof Error ? e.message : e);
    return null;
  }
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T23:59:59Z");
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  console.log(`🔍 Enrich deadline per anno ${YEAR} (limit ${LIMIT}${DRY_RUN ? ", DRY RUN" : ""})\n`);

  const editions = await prisma.festivalEdition.findMany({
    where: {
      year: YEAR,
      deadlineEarly: null,
      deadlineGeneral: null,
      deadlineLate: null,
      deadlineFinal: null,
    },
    include: {
      festivalMaster: {
        select: { id: true, canonicalName: true, country: true, submissionUrlBase: true },
      },
    },
    take: LIMIT,
    orderBy: { festivalName: "asc" },
  });

  console.log(`Trovate ${editions.length} edizioni candidate\n`);

  let enriched = 0;
  let empty = 0;
  let failed = 0;

  for (let i = 0; i < editions.length; i++) {
    const e = editions[i];
    const name = e.festivalName || e.festivalMaster.canonicalName || "Unknown";
    console.log(`[${i + 1}/${editions.length}] ${name} (${e.festivalMaster.country || "?"})`);

    const result = await searchDeadlines(name, e.festivalMaster.country, YEAR);
    if (!result) {
      failed++;
      continue;
    }

    const data = {
      deadlineEarly: parseDate(result.deadlineEarly),
      deadlineGeneral: parseDate(result.deadlineGeneral),
      deadlineLate: parseDate(result.deadlineLate),
      deadlineFinal: parseDate(result.deadlineFinal),
      eventStartDate: parseDate(result.eventStartDate),
      eventEndDate: parseDate(result.eventEndDate),
      sourceNotes: result.sourceUrl
        ? `AI enrich ${new Date().toISOString().slice(0, 10)} (${result.confidence}): ${result.sourceUrl}`
        : `AI enrich ${new Date().toISOString().slice(0, 10)} (${result.confidence}): ${result.notes}`,
      sourceLastCheckedAt: new Date(),
      sourceLastCheckedBy: "ai-enrich-script",
    };

    const anyDeadline =
      data.deadlineEarly || data.deadlineGeneral || data.deadlineLate || data.deadlineFinal;

    if (!anyDeadline) {
      console.log(`  ⚪️  no deadline found — ${result.notes} [${result.confidence}]`);
      empty++;
      continue;
    }

    console.log(
      `  ✅ early=${result.deadlineEarly ?? "-"} general=${result.deadlineGeneral ?? "-"} late=${result.deadlineLate ?? "-"} final=${result.deadlineFinal ?? "-"} [${result.confidence}]`
    );

    if (!DRY_RUN) {
      await prisma.festivalEdition.update({ where: { id: e.id }, data });
    }
    enriched++;

    // courtesy sleep to avoid hammering
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n📊 Risultati:`);
  console.log(`  ✅ Arricchite: ${enriched}`);
  console.log(`  ⚪️  Senza deadline trovata: ${empty}`);
  console.log(`  ❌ Errori API: ${failed}`);

  if (!DRY_RUN && enriched > 0) {
    console.log(`\n🗓  Ricalcolo activeDeadline su tutte le edizioni...`);
    const stats = await fillActiveDeadlines(prisma, new Date());
    console.log(`  Updated: ${stats.updated}, cleared: ${stats.cleared}, skipped: ${stats.skipped}`);
    console.log(
      `  Urgency: urgent=${stats.urgency.urgent} soon=${stats.urgency.soon} comf=${stats.urgency.comfortable} far=${stats.urgency.far} past=${stats.urgency.past}`
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Script failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
