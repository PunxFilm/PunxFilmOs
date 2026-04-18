#!/usr/bin/env tsx
/**
 * cleanup-films.ts — cancella TUTTI i film dal DB, preservando festival, persone, auth.
 *
 * Cosa viene cancellato (cascade dallo schema Prisma):
 *   - Film
 *   - FilmMaterial      (onDelete: Cascade)
 *   - Submission        (onDelete: Cascade)
 *   - DistributionPlan  (onDelete: Cascade) → PlanEntry (onDelete: Cascade)
 *   - DistributionContract (onDelete: Cascade)
 *
 * Cosa NON viene cancellato:
 *   - FestivalMaster, FestivalEdition, FestivalMaterialRequirement
 *   - Person, User, Account, Session, VerificationToken
 *   - WaiverRequest (legato a FestivalEdition, non a Film)
 *   - FinanceEntry (no FK a Film — preservato)
 *   - Task.filmId → viene messo a NULL (task conservato, orfano)
 *
 * USAGE:
 *   npx tsx scripts/cleanup-films.ts                  # dry-run (default, nessuna modifica)
 *   npx tsx scripts/cleanup-films.ts --apply          # esegue DAVVERO
 *   npx tsx scripts/cleanup-films.ts --apply --yes    # esegue senza prompt di conferma
 *
 * ENV richiesto:
 *   DATABASE_URL   — connessione Postgres Railway
 */

import { PrismaClient } from "@prisma/client";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const args = new Set(process.argv.slice(2));
const DRY_RUN = !args.has("--apply");
const SKIP_CONFIRM = args.has("--yes");

const prisma = new PrismaClient();

async function confirm(promptText: string): Promise<boolean> {
  if (SKIP_CONFIRM) return true;
  const rl = readline.createInterface({ input, output });
  const ans = (await rl.question(`${promptText} (yes/no): `)).trim().toLowerCase();
  rl.close();
  return ans === "yes" || ans === "y";
}

async function main() {
  console.log("─".repeat(70));
  console.log(DRY_RUN ? "🔍 DRY-RUN — nessuna modifica al DB" : "🔥 MODALITÀ APPLY — verranno cancellati i dati");
  console.log("─".repeat(70));

  // 1. Snapshot pre-cleanup
  const [
    films,
    filmMaterials,
    submissions,
    distributionPlans,
    planEntries,
    distributionContracts,
    tasksWithFilm,
    festivalMasters,
    festivalEditions,
    persons,
    users,
  ] = await Promise.all([
    prisma.film.count(),
    prisma.filmMaterial.count(),
    prisma.submission.count(),
    prisma.distributionPlan.count(),
    prisma.planEntry.count(),
    prisma.distributionContract.count(),
    prisma.task.count({ where: { filmId: { not: null } } }),
    prisma.festivalMaster.count(),
    prisma.festivalEdition.count(),
    prisma.person.count(),
    prisma.user.count(),
  ]);

  console.log("\n📊 STATO ATTUALE DEL DB:");
  console.log(`  Film                    : ${films}`);
  console.log(`  FilmMaterial            : ${filmMaterials}     (sarà cancellato per cascade)`);
  console.log(`  Submission              : ${submissions}     (sarà cancellato per cascade)`);
  console.log(`  DistributionPlan        : ${distributionPlans}     (sarà cancellato per cascade)`);
  console.log(`  PlanEntry               : ${planEntries}     (sarà cancellato per cascade)`);
  console.log(`  DistributionContract    : ${distributionContracts}     (sarà cancellato per cascade)`);
  console.log(`  Task (con filmId)       : ${tasksWithFilm}     (filmId → null, task conservati)`);
  console.log("  ─");
  console.log(`  FestivalMaster          : ${festivalMasters}     (PRESERVATO)`);
  console.log(`  FestivalEdition         : ${festivalEditions}     (PRESERVATO)`);
  console.log(`  Person                  : ${persons}     (PRESERVATO)`);
  console.log(`  User                    : ${users}     (PRESERVATO)`);

  if (films === 0) {
    console.log("\n✅ Nessun film da cancellare. Uscita.");
    return;
  }

  if (DRY_RUN) {
    console.log(`\n👀 Sarebbero cancellati ${films} film e tutti i record correlati per cascade.`);
    console.log("   Per eseguire davvero: npx tsx scripts/cleanup-films.ts --apply");
    return;
  }

  // 2. Conferma interattiva
  const ok = await confirm(
    `\n⚠️  Stai per cancellare ${films} film (+ cascade) dal database. Procedere?`
  );
  if (!ok) {
    console.log("Annullato.");
    return;
  }

  // 3. Delete in transazione
  console.log("\n🔥 Cancellazione in corso...");
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.film.deleteMany({});
    return { filmsDeleted: deleted.count };
  });

  // 4. Snapshot post-cleanup
  const [
    filmsAfter,
    materialsAfter,
    submissionsAfter,
    plansAfter,
    planEntriesAfter,
    contractsAfter,
    tasksOrphanedAfter,
    festivalMastersAfter,
    festivalEditionsAfter,
  ] = await Promise.all([
    prisma.film.count(),
    prisma.filmMaterial.count(),
    prisma.submission.count(),
    prisma.distributionPlan.count(),
    prisma.planEntry.count(),
    prisma.distributionContract.count(),
    prisma.task.count({ where: { filmId: null } }),
    prisma.festivalMaster.count(),
    prisma.festivalEdition.count(),
  ]);

  console.log(`\n✅ Cancellati ${result.filmsDeleted} film.`);
  console.log("\n📊 STATO POST-CLEANUP:");
  console.log(`  Film                    : ${filmsAfter}`);
  console.log(`  FilmMaterial            : ${materialsAfter}`);
  console.log(`  Submission              : ${submissionsAfter}`);
  console.log(`  DistributionPlan        : ${plansAfter}`);
  console.log(`  PlanEntry               : ${planEntriesAfter}`);
  console.log(`  DistributionContract    : ${contractsAfter}`);
  console.log(`  Task orfani (filmId=NULL): ${tasksOrphanedAfter}`);
  console.log("  ─");
  console.log(`  FestivalMaster          : ${festivalMastersAfter}     (invariato: ${festivalMastersAfter === festivalMasters ? "✅" : "⚠️  DIFFERISCE"})`);
  console.log(`  FestivalEdition         : ${festivalEditionsAfter}     (invariato: ${festivalEditionsAfter === festivalEditions ? "✅" : "⚠️  DIFFERISCE"})`);
}

main()
  .catch((e) => {
    console.error("\n❌ ERRORE:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
