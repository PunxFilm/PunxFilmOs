/**
 * Export all DB tables to JSON files in prisma/data/
 * Usage: npx tsx scripts/export-db.ts
 *
 * Used to migrate from SQLite (dev) to Postgres (Railway production).
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const DATA_DIR = join(process.cwd(), "prisma", "data");

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  // All Prisma models (match schema.prisma, excluding auth models which are empty)
  const tables = [
    "person",
    "film",
    "filmMaterial",
    "distributionContract",
    "festivalMaster",
    "festivalEdition",
    "festivalMaterialRequirement",
    "submission",
    "distributionPlan",
    "planEntry",
    "task",
    "waiverRequest",
    "financeEntry",
  ] as const;

  for (const table of tables) {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic access
    const rows = await (prisma as any)[table].findMany();
    const path = join(DATA_DIR, `${table}.json`);
    writeFileSync(path, JSON.stringify(rows, null, 2));
    console.log(`✓ ${table}: ${rows.length} rows → ${path}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
