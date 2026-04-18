/**
 * Seed tracking materiali per i 7 film esistenti + piano distribuzione demo per
 * FEDELI ALLA LINEA. Usage: npx tsx scripts/seed-onboarding.ts
 *
 * Idempotente: salta se già popolato.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REQUIRED_MATERIALS = [
  { type: "screener_link", isRequired: true },
  { type: "poster", isRequired: true },
  { type: "trailer", isRequired: true },
  { type: "tech_sheet", isRequired: true },
  { type: "subtitles_en", isRequired: true },
  { type: "press_kit", isRequired: false },
  { type: "still", isRequired: false },
  { type: "dcp", isRequired: false },
  { type: "dialogue_list", isRequired: false },
  { type: "bio_director", isRequired: true },
] as const;

async function seedMaterials() {
  const films = await prisma.film.findMany({ select: { id: true, titleOriginal: true } });
  console.log(`\n📦 Materiali placeholder per ${films.length} film`);
  let created = 0;
  for (const film of films) {
    for (const m of REQUIRED_MATERIALS) {
      const existing = await prisma.filmMaterial.findUnique({
        where: { filmId_type: { filmId: film.id, type: m.type } },
      });
      if (existing) continue;
      await prisma.filmMaterial.create({
        data: {
          filmId: film.id,
          type: m.type,
          status: "missing",
          isRequired: m.isRequired,
        },
      });
      created++;
    }
  }
  console.log(`  ✓ Creati ${created} tracking materiali`);
}

async function seedFedeliPlan() {
  const fedeli = await prisma.film.findFirst({
    where: { titleOriginal: { contains: "FEDELI" } },
  });
  if (!fedeli) {
    console.log("\n⚠ FEDELI ALLA LINEA non trovato, skip piano");
    return;
  }

  const existingPlan = await prisma.distributionPlan.findFirst({
    where: { filmId: fedeli.id, status: "active" },
  });
  if (existingPlan) {
    console.log(`\n  ✓ Piano per FEDELI già esistente (${existingPlan.id}), skip`);
    return;
  }

  // Prendo i 5 festival target preferibilmente con edizione 2026
  const targetNames = [
    "Festival de Cannes - Court Metrage",
    "Clermont-Ferrand International Short Film Festival",
    "International Short Film Festival Oberhausen",
    "Locarno Film Festival",
    "Vienna Shorts International Short Film Festival",
  ];

  const masters = await Promise.all(
    targetNames.map(async (name) => {
      const m = await prisma.festivalMaster.findFirst({
        where: { name: { contains: name.slice(0, 20) } },
        include: {
          editions: {
            where: { year: 2026 },
            take: 1,
          },
        },
      });
      return m;
    })
  );

  const valid = masters.filter((m) => m && m.editions.length > 0) as NonNullable<
    (typeof masters)[number]
  >[];
  console.log(
    `\n🎬 Piano distribuzione per FEDELI ALLA LINEA: ${valid.length}/${targetNames.length} festival trovati`
  );

  const plan = await prisma.distributionPlan.create({
    data: {
      filmId: fedeli.id,
      premiereLevel: "world",
      status: "active",
      aiAnalysis: JSON.stringify({
        source: "manual-seed",
        strategy:
          "Premiere Oscar-qualifying: Cannes Court Métrage come first choice, poi queue europea A-list",
      }),
    },
  });

  let position = 0;
  for (const m of valid) {
    const edition = m.editions[0];
    const isPremiere = position === 0; // Cannes (primo) è premiere
    await prisma.planEntry.create({
      data: {
        planId: plan.id,
        festivalMasterId: m.id,
        festivalEditionId: edition.id,
        role: isPremiere ? "premiere" : "queue",
        position,
        status: isPremiere ? "approved" : "pending",
        priority: isPremiere ? "A" : "A",
        matchScore: isPremiere ? 92 : 80,
        matchReasoning: isPremiere
          ? "Cannes Court Métrage: world premiere Oscar-qualifying di massimo prestigio"
          : `${m.name}: festival Oscar-qualifying europeo, buon match tematico e di durata`,
        estimatedFee: edition.feeAmount || 0,
      },
    });
    position++;
  }
  console.log(`  ✓ Piano creato (ID: ${plan.id}) con ${valid.length} entries`);

  // Submission demo: primo queue entry (Clermont) come "submitted"
  if (valid.length >= 2) {
    const clermont = valid[1];
    const edition = clermont.editions[0];
    const existingSub = await prisma.submission.findFirst({
      where: { filmId: fedeli.id, festivalEditionId: edition.id },
    });
    if (!existingSub) {
      await prisma.submission.create({
        data: {
          filmId: fedeli.id,
          festivalEditionId: edition.id,
          status: "submitted",
          platform: "direct",
          submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          feesPaid: edition.feeAmount || 0,
          notes: "Demo submission — testare tracking pipeline",
        },
      });
      console.log(`  ✓ Submission demo creata per ${clermont.name}`);
    }
  }
}

async function main() {
  console.log("🌱 Onboarding seed");
  await seedMaterials();
  await seedFedeliPlan();
  console.log("\n✅ Completato");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌", e);
  await prisma.$disconnect();
  process.exit(1);
});
