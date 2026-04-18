/**
 * Production seed script
 * Reads JSON files from prisma/data/ and populates the database.
 * Idempotent: skips if tables already have data.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *
 * Env vars required:
 *   DATABASE_URL      — Postgres connection string
 *   ADMIN_EMAIL       — email for seeded admin user
 *   ADMIN_PASSWORD    — password for seeded admin user
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DATA_DIR = join(process.cwd(), "prisma", "data");

function loadJson(filename: string): Record<string, unknown>[] {
  const path = join(DATA_DIR, `${filename}.json`);
  if (!existsSync(path)) {
    console.warn(`  ⚠ ${filename}.json not found, skipping`);
    return [];
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Coerce date-string fields back to Date objects when importing.
 * SQLite's JSON serialization outputs ISO strings.
 */
function reviveDates<T extends Record<string, unknown>>(row: T): T {
  const result: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(row)) {
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      result[key] = new Date(value);
    }
  }
  return result as T;
}

async function seedTable<T extends Record<string, unknown>>(
  name: string,
  // biome-ignore lint/suspicious/noExplicitAny: dynamic prisma client access
  model: any,
  rows: T[]
) {
  const existing = await model.count();
  if (existing > 0) {
    console.log(`  ✓ ${name}: ${existing} rows already present, skipping`);
    return;
  }
  if (rows.length === 0) {
    console.log(`  ✓ ${name}: no data to seed`);
    return;
  }

  // Insert in batches of 100 to avoid Postgres parameter limit
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(reviveDates);
    await model.createMany({ data: batch, skipDuplicates: true });
    inserted += batch.length;
  }
  console.log(`  ✓ ${name}: ${inserted} rows inserted`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@punxfilm.it").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "changeme-at-first-login";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ✓ Admin user ${email} already exists`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      passwordHash,
      role: "admin",
    },
  });
  console.log(`  ✓ Admin user created: ${email}`);
  if (password === "changeme-at-first-login") {
    console.log(`    ⚠ Default password in use. Change it immediately.`);
  }
}

async function main() {
  console.log("🌱 Seeding PunxFilm OS database…\n");

  console.log("1. Admin user");
  await seedAdmin();

  console.log("\n2. Persons");
  await seedTable("person", prisma.person, loadJson("person"));

  console.log("\n3. Films");
  await seedTable("film", prisma.film, loadJson("film"));
  await seedTable("filmMaterial", prisma.filmMaterial, loadJson("filmMaterial"));
  await seedTable(
    "distributionContract",
    prisma.distributionContract,
    loadJson("distributionContract")
  );

  console.log("\n4. Festival database");
  await seedTable("festivalMaster", prisma.festivalMaster, loadJson("festivalMaster"));
  await seedTable("festivalEdition", prisma.festivalEdition, loadJson("festivalEdition"));
  await seedTable(
    "festivalMaterialRequirement",
    prisma.festivalMaterialRequirement,
    loadJson("festivalMaterialRequirement")
  );

  console.log("\n5. Distribution plans & submissions");
  await seedTable("distributionPlan", prisma.distributionPlan, loadJson("distributionPlan"));
  await seedTable("submission", prisma.submission, loadJson("submission"));
  await seedTable("planEntry", prisma.planEntry, loadJson("planEntry"));

  console.log("\n6. Tasks, waivers, finance");
  await seedTable("task", prisma.task, loadJson("task"));
  await seedTable("waiverRequest", prisma.waiverRequest, loadJson("waiverRequest"));
  await seedTable("financeEntry", prisma.financeEntry, loadJson("financeEntry"));

  console.log("\n✅ Seeding completed");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
