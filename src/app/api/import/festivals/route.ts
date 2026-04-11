import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE44_URL = "https://base44.app/api/apps/69b9e6cb2f507ecb5daf9a4f/entities";
const BASE44_KEY = "b08e351b80aa415186fa279285fc0f3a";

async function fetchBase44(entity: string) {
  const res = await fetch(`${BASE44_URL}/${entity}`, {
    headers: { api_key: BASE44_KEY, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Base44 fetch failed: ${res.status}`);
  return res.json();
}

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST() {
  try {
    // Fase 1: Fetch entrambe le entity da Base44
    const [masters, editions] = await Promise.all([
      fetchBase44("FestivalMaster"),
      fetchBase44("FestivalEdition"),
    ]);

    // Fase 2: Import FestivalMaster
    const activeMasters = masters.filter((f: Record<string, unknown>) => !f.is_merged_duplicate);
    let mastersImported = 0;
    let mastersErrors = 0;

    for (let i = 0; i < activeMasters.length; i += 50) {
      const batch = activeMasters.slice(i, i + 50);
      const results = await Promise.allSettled(
        batch.map((f: Record<string, unknown>) =>
          prisma.festivalMaster.upsert({
            where: { base44Id: f.id as string },
            update: mapMaster(f),
            create: { base44Id: f.id as string, ...mapMaster(f) },
          })
        )
      );
      for (const r of results) {
        if (r.status === "fulfilled") mastersImported++;
        else mastersErrors++;
      }
    }

    // Fase 3: Mappa base44Id → nostro id per FestivalMaster
    const masterMap = new Map<string, string>();
    const allMasters = await prisma.festivalMaster.findMany({ select: { id: true, base44Id: true } });
    for (const m of allMasters) {
      if (m.base44Id) masterMap.set(m.base44Id, m.id);
    }

    // Fase 4: Import FestivalEdition
    let editionsImported = 0;
    let editionsSkipped = 0;
    let editionsErrors = 0;

    for (let i = 0; i < editions.length; i += 50) {
      const batch = editions.slice(i, i + 50);
      const results = await Promise.allSettled(
        batch.map((e: Record<string, unknown>) => {
          const masterId = masterMap.get(e.festival_master_id as string);
          if (!masterId) {
            editionsSkipped++;
            return Promise.resolve(null);
          }
          const year = Math.round(e.edition_year as number || new Date().getFullYear());
          return prisma.festivalEdition.upsert({
            where: { base44Id: e.id as string },
            update: mapEdition(e, masterId, year),
            create: { base44Id: e.id as string, ...mapEdition(e, masterId, year) },
          });
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value !== null) editionsImported++;
        else if (r.status === "rejected") editionsErrors++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Import completato",
      masters: { total: activeMasters.length, imported: mastersImported, errors: mastersErrors },
      editions: { total: editions.length, imported: editionsImported, skipped: editionsSkipped, errors: editionsErrors },
    });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ error: `Errore nell'import: ${e}` }, { status: 500 });
  }
}

function mapMaster(f: Record<string, unknown>) {
  return {
    name: (f.name as string) || "Sconosciuto",
    canonicalName: f.canonical_name as string | null,
    country: (f.country as string) || "Sconosciuto",
    region: f.region as string | null,
    city: (f.city as string) || "Sconosciuto",
    website: f.website as string | null,
    instagram: f.instagram as string | null,
    classification: f.classification as string | null,
    type: f.type as string | null,
    focus: f.focus as string | null,
    maxMinutes: f.max_minutes as number | null,
    acceptedGenres: f.accepted_genres as string | null,
    acceptedThemes: f.accepted_themes as string | null,
    acceptsFirstWork: (f.accepts_first_work as boolean) || false,
    directorRequirements: f.director_requirements as string | null,
    regulationsUrl: f.regulations_url as string | null,
    qualityScore: f.quality_score as number | null,
    academyQualifying: (f.academy_qualifying as boolean) || false,
    baftaQualifying: (f.bafta_qualifying as boolean) || false,
    canadianScreenQualifying: (f.canadian_screen_qualifying as boolean) || false,
    goyaQualifying: (f.goya_qualifying as boolean) || false,
    efaQualifying: (f.efa_qualifying as boolean) || false,
    shortFilmConferenceMember: (f.short_film_conference_member as boolean) || false,
    qualifying: f.qualifying as string | null,
    screeningType: f.screening_type as string | null,
    screeningLocation: f.screening_location as string | null,
    screeningQuality: f.screening_quality as string | null,
    dcp: (f.dcp as boolean) || false,
    industry: (f.industry as boolean) || false,
    maxYearsProduction: f.max_years_production as number | null,
    travelSupport: f.travel_support as string | null,
    hospitalitySupport: f.hospitality_support as string | null,
    contactName: f.contact_name as string | null,
    contactRole: f.contact_role as string | null,
    contactTelephone: f.contact_telephone as string | null,
    contactEmailDirector: f.contact_email_director as string | null,
    contactEmailInfo: f.contact_email_info as string | null,
    contactEmailTechnical: f.contact_email_technical as string | null,
    internalNotes: f.internal_notes as string | null,
    punxHistory: f.punx_history as string | null,
    submissionUrlBase: f.submission_url_base as string | null,
    submissionPlatform: f.submission_platform as string | null,
    isActive: (f.is_active as boolean) ?? true,
    isMergedDuplicate: (f.is_merged_duplicate as boolean) || false,
    mergedIntoFestivalId: f.merged_into_festival_id as string | null,
    lastVerifiedAt: parseDate(f.last_verified_at as string),
    verificationStatus: (f.verification_status as string) || "unverified",
    needsAiRefresh: (f.needs_ai_refresh as boolean) || false,
    verificationNotes: f.verification_notes as string | null,
    dataConfidenceScore: f.data_confidence_score as number | null,
    sourceLastChecked: f.source_last_checked as string | null,
    sourceLastCheckedAt: parseDate(f.source_last_checked_at as string),
    sourceNotes: f.source_notes as string | null,
    foundedYear: f.founded_year as number | null,
    openingDate: f.opening_date as string | null,
    waiverType: "none",
  };
}

function mapEdition(e: Record<string, unknown>, festivalMasterId: string, year: number) {
  return {
    festivalMasterId,
    festivalName: e.festival_name as string | null,
    year,
    editionNumber: e.edition_number as number | null,
    lifecycleStatus: e.lifecycle_status as string | null,
    isLocked: (e.is_locked as boolean) || false,
    openingDate: parseDate(e.opening_date as string),
    deadlineEarly: parseDate(e.early_deadline as string),
    deadlineGeneral: parseDate(e.regular_deadline as string),
    deadlineLate: parseDate(e.late_deadline as string),
    deadlineFinal: parseDate(e.final_deadline as string),
    deadlineRaw: e.deadline_raw as string | null,
    activeDeadlineType: e.active_deadline_type as string | null,
    activeDeadlineDate: parseDate(e.active_deadline_date as string),
    daysToDeadline: e.days_to_deadline as number | null,
    notificationDate: parseDate(e.notification_date as string),
    notificationDateRaw: e.notification_date_raw as string | null,
    eventStartDate: parseDate(e.event_start_date as string),
    eventEndDate: parseDate(e.event_end_date as string),
    eventPeriodRaw: e.event_period_raw as string | null,
    feeAmountRaw: e.fee_amount_raw as string | null,
    feeAmount: e.fee_amount as number | null,
    feeLateFee: e.fee_late_amount as number | null,
    feeCurrency: (e.fee_currency as string) || "USD",
    docuFeeRaw: e.docu_fee_raw as string | null,
    docuFeeAmount: e.docu_fee_amount as number | null,
    screeningFee: e.screening_fee as number | null,
    prizeRaw: e.prize_raw as string | null,
    prizeCash: e.prize_cash as number | null,
    prizeService: e.prize_service as string | null,
    prizeDescription: e.prize_description as string | null,
    docuPrizeRaw: e.docu_prize_raw as string | null,
    premiereRules: e.premiere_rules as string | null,
    durationRules: e.duration_rules as string | null,
    categoryRules: e.category_rules as string | null,
    regulationsText: e.regulations_text as string | null,
    sectionCategories: e.section_categories as string | null,
    themes: e.themes as string | null,
    waiverPolicy: e.waiver_policy as string | null,
    waiverCode: e.waiver_code as string | null,
    waiverNotes: e.waiver_notes as string | null,
    status: e.status as string | null,
    computedStatus: e.computed_status as string | null,
    verificationStatus: (e.verification_status as string) || "unverified",
    lastVerifiedDate: parseDate(e.last_verified_date as string),
    needsReview: (e.needs_review as boolean) || false,
    inheritedFromPrevious: (e.inherited_from_previous as boolean) || false,
    lastSyncFilmfreeway: parseDate(e.last_sync_filmfreeway as string),
    filmfreewaySyncNotes: e.filmfreeway_sync_notes as string | null,
    sourceLastCheckedAt: parseDate(e.source_last_checked_at as string),
    sourceLastCheckedBy: e.source_last_checked_by as string | null,
    sourceNotes: e.source_notes as string | null,
    sourceUrlsChecked: e.source_urls_checked as string | null,
    importNotes: e.import_notes as string | null,
    notes: e.notes as string | null,
  };
}
