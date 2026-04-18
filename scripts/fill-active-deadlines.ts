/**
 * Popola activeDeadlineType, activeDeadlineDate, daysToDeadline su tutte le
 * FestivalEdition leggendo le 4 deadline (early/general/late/final).
 *
 * Usage: npx tsx scripts/fill-active-deadlines.ts
 *
 * Idempotente: può essere rieseguito quotidianamente. Stessa logica è esposta
 * tramite `/api/cron/fill-deadlines` (eseguito da GitHub Actions).
 */
import { PrismaClient } from "@prisma/client";
import { fillActiveDeadlines } from "../src/lib/fill-deadlines-core";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log(`🗓  Calcolo deadline attive @ ${now.toISOString()}\n`);

  const stats = await fillActiveDeadlines(prisma, now);

  console.log(`  Totale edizioni: ${stats.total}`);
  console.log(`\n✅ Completato in ${(stats.durationMs / 1000).toFixed(1)}s`);
  console.log(`  Aggiornate: ${stats.updated}`);
  console.log(`  Svuotate (deadline tutte passate): ${stats.cleared}`);
  console.log(`  Invariate: ${stats.skipped}`);
  console.log(`\n📊 Urgenza complessiva:`);
  console.log(`  🚨 Urgent (≤7gg): ${stats.urgency.urgent}`);
  console.log(`  ⏰ Soon (8-30gg): ${stats.urgency.soon}`);
  console.log(`  🟢 Comfortable (31-90gg): ${stats.urgency.comfortable}`);
  console.log(`  🟦 Far (>90gg): ${stats.urgency.far}`);
  console.log(`  🔳 Past / no deadline: ${stats.urgency.past}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Script failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
