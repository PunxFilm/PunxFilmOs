/**
 * Popola activeDeadlineType, activeDeadlineDate, daysToDeadline su tutte le
 * FestivalEdition leggendo le 4 deadline (early/general/late/final).
 *
 * Usage: npx tsx scripts/fill-active-deadlines.ts
 *
 * Idempotente: può essere rieseguito quotidianamente (cron Railway) per
 * aggiornare daysToDeadline e far "avanzare" activeDeadlineType quando
 * una deadline passa.
 */
import { PrismaClient } from "@prisma/client";
import { computeActiveDeadlineFields } from "../src/lib/deadline-helpers";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log(`🗓  Calcolo deadline attive @ ${now.toISOString()}\n`);

  const editions = await prisma.festivalEdition.findMany({
    select: {
      id: true,
      festivalName: true,
      year: true,
      deadlineEarly: true,
      deadlineGeneral: true,
      deadlineLate: true,
      deadlineFinal: true,
      activeDeadlineType: true,
      activeDeadlineDate: true,
    },
  });

  console.log(`  Totale edizioni: ${editions.length}`);

  let updated = 0;
  let cleared = 0;
  let skipped = 0;
  const urgency = { urgent: 0, soon: 0, comfortable: 0, far: 0, past: 0 };

  for (const e of editions) {
    const fields = computeActiveDeadlineFields(e, now);

    // Classifica per metrica finale
    if (fields.daysToDeadline == null) urgency.past++;
    else if (fields.daysToDeadline <= 7) urgency.urgent++;
    else if (fields.daysToDeadline <= 30) urgency.soon++;
    else if (fields.daysToDeadline <= 90) urgency.comfortable++;
    else urgency.far++;

    // Skip se niente da aggiornare
    const currentTypeKey = e.activeDeadlineType || null;
    const currentDateMs = e.activeDeadlineDate ? e.activeDeadlineDate.getTime() : null;
    const newDateMs = fields.activeDeadlineDate ? fields.activeDeadlineDate.getTime() : null;

    if (currentTypeKey === fields.activeDeadlineType && currentDateMs === newDateMs) {
      skipped++;
      continue;
    }

    await prisma.festivalEdition.update({
      where: { id: e.id },
      data: fields,
    });

    if (fields.activeDeadlineDate) updated++;
    else cleared++;
  }

  console.log(`\n✅ Completato`);
  console.log(`  Aggiornate: ${updated}`);
  console.log(`  Svuotate (deadline tutte passate): ${cleared}`);
  console.log(`  Invariate: ${skipped}`);
  console.log(`\n📊 Urgenza complessiva:`);
  console.log(`  🚨 Urgent (≤7gg): ${urgency.urgent}`);
  console.log(`  ⏰ Soon (8-30gg): ${urgency.soon}`);
  console.log(`  🟢 Comfortable (31-90gg): ${urgency.comfortable}`);
  console.log(`  🟦 Far (>90gg): ${urgency.far}`);
  console.log(`  🔳 Past / no deadline: ${urgency.past}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Script failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
