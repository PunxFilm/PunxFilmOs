/**
 * One-shot: distribuzione FestivalEdition per anno con conteggio deadline future.
 * Uso: DATABASE_URL=<postgres_public_url> npx tsx scripts/year-report.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ year: number; total: bigint; with_deadline: bigint; future: bigint }>
  >(`
    SELECT
      year::int as year,
      COUNT(*)::bigint AS total,
      COUNT("activeDeadlineDate")::bigint AS with_deadline,
      COUNT(*) FILTER (WHERE "activeDeadlineDate" > NOW())::bigint AS future
    FROM "FestivalEdition"
    GROUP BY year
    ORDER BY year
  `);
  console.log("year | total | with_deadline | future");
  console.log("-----+-------+---------------+-------");
  for (const r of rows) {
    console.log(
      `${r.year} | ${String(r.total).padStart(5)} | ${String(r.with_deadline).padStart(13)} | ${String(r.future).padStart(6)}`
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
