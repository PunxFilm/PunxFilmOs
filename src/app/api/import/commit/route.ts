import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FilmSheetData } from "@/lib/import/film-sheet-parser";

interface CommitFilm {
  action: "create" | "update" | "existing";
  data?: FilmSheetData;
  existingId?: string;
  updateId?: string;
}

interface CommitSubmission {
  festivalMasterId: string;
  festivalName?: string | null;
  status?: string | null;
  listPrice?: number | null;
  feesPaid?: number | null; // pagato al festival
  estimatedFee?: number | null; // addebitato al cliente (listPrice - sconto)
  notes?: string | null;
  deadline?: string | null;
  notificationDate?: string | null;
  eventDate?: string | null;
  externalId?: number | null;
  submissionLink?: string | null;
  prize?: string | null;
  location?: string | null;
}

interface CommitQueueEntry {
  festivalMasterId: string;
  priority?: string | null;
  position?: number;
  eventDate?: string | null;
}

interface CommitPayload {
  film: CommitFilm;
  submissions?: CommitSubmission[];
  queue?: CommitQueueEntry[];
  dedupResolutions?: Record<string, "update" | "skip" | "duplicate">;
}

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function mapStatus(status: string | null | undefined): string {
  if (!status) return "draft";
  const s = status.toLowerCase();
  if (s.includes("not selected") || s.includes("rejected") || s.includes("rifiut"))
    return "rejected";
  if (s.includes("selected") || s.includes("accepted") || s.includes("accettat"))
    return "accepted";
  if (s.includes("undecided") || s.includes("pending") || s.includes("attesa"))
    return "submitted";
  if (s.includes("draft") || s.includes("bozza")) return "draft";
  if (s.includes("submitted") || s.includes("inviat")) return "submitted";
  if (s.includes("withdraw") || s.includes("ritirat")) return "withdrawn";
  return "draft";
}

function mapPremiereLevel(premiereStatus: string | null | undefined): string {
  if (!premiereStatus) return "world";
  const s = premiereStatus.toLowerCase();
  if (s.includes("world")) return "world";
  if (s.includes("international")) return "international";
  if (s.includes("european")) return "european";
  if (s.includes("national")) return "national";
  return "world";
}

/** Merge prudente: aggiorna solo i campi del DB che sono null/empty con valori nuovi. */
function mergeFilmData(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (v == null || v === "") continue;
    const cur = existing[k];
    if (cur == null || cur === "" || cur === 0) {
      out[k] = v;
    }
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CommitPayload;

    if (!payload.film) {
      return NextResponse.json(
        { error: "Sezione 'film' obbligatoria" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const summary = {
        filmId: "",
        filmAction: payload.film.action,
        personDirectorId: null as string | null,
        personProducerId: null as string | null,
        planId: "",
        submissionsCreated: 0,
        submissionsUpdated: 0,
        submissionsSkipped: 0,
        editionsCreated: 0,
        planEntriesCreated: 0,
        queueEntriesCreated: 0,
        queueEntriesSkipped: 0,
        financeEntriesCreated: 0,
      };

      // ────────────────────────────────────────────────────────────
      // 1. FILM (create | update | existing)
      // ────────────────────────────────────────────────────────────
      let filmId: string;
      let filmTitle: string;
      let filmPremiereStatus: string | null = null;

      if (payload.film.action === "existing") {
        if (!payload.film.existingId) {
          throw new Error("action=existing richiede 'existingId'");
        }
        const existing = await tx.film.findUnique({
          where: { id: payload.film.existingId },
          select: { id: true, titleOriginal: true, premiereStatus: true },
        });
        if (!existing) throw new Error("Film esistente non trovato");
        filmId = existing.id;
        filmTitle = existing.titleOriginal;
        filmPremiereStatus = existing.premiereStatus;
      } else if (payload.film.action === "update") {
        const targetId = payload.film.updateId ?? payload.film.existingId;
        if (!targetId) throw new Error("action=update richiede 'updateId'");
        const existing = await tx.film.findUnique({
          where: { id: targetId },
        });
        if (!existing) throw new Error("Film da aggiornare non trovato");

        const d = payload.film.data;
        if (d) {
          // Merge prudente persone: se il film ha già person director/producer, non li cambiamo.
          let personDirectorId = existing.personDirectorId;
          let personProducerId = existing.personProducerId;

          if (!personDirectorId && d.director && (d.director.firstName || d.director.lastName)) {
            const pd = await tx.person.create({
              data: {
                firstName: d.director.firstName ?? "",
                lastName: d.director.lastName ?? "",
                birthDate: parseDate(d.director.birthDate),
                codiceFiscale: d.director.codiceFiscale ?? null,
                partitaIva: d.director.partitaIva ?? null,
                email: d.director.email ?? null,
                phone: d.director.phone ?? null,
                bioIt: d.director.bioIt ?? null,
                bioEn: d.director.bioEn ?? null,
                filmography: d.director.filmography ?? null,
                socialMedia: d.director.socialMedia ?? null,
              },
            });
            personDirectorId = pd.id;
            summary.personDirectorId = pd.id;
          }

          if (!personProducerId && d.producer && (d.producer.firstName || d.producer.lastName || d.producer.company)) {
            const pp = await tx.person.create({
              data: {
                firstName: d.producer.firstName ?? "",
                lastName: d.producer.lastName ?? "",
                email: d.producer.email ?? null,
                phone: d.producer.phone ?? null,
                website: d.producer.website ?? null,
                company: d.producer.company ?? null,
                socialMedia: d.producer.socialMedia ?? null,
              },
            });
            personProducerId = pp.id;
            summary.personProducerId = pp.id;
          }

          const directorFullName = d.director
            ? `${d.director.firstName ?? ""} ${d.director.lastName ?? ""}`.trim()
            : null;

          const incoming = {
            titleOriginal: d.titleOriginal ?? undefined,
            titleInternational: d.titleInternational ?? undefined,
            titleOtherLanguages: d.titleOtherLanguages ?? undefined,
            director: directorFullName || undefined,
            screenwriters: d.screenwriters ?? undefined,
            year: d.year ?? undefined,
            duration: d.duration ?? undefined,
            genre: d.genre ?? undefined,
            country: d.country ?? undefined,
            productionBudget: d.productionBudget ?? undefined,
            shootingFormat: d.shootingFormat ?? undefined,
            soundFormat: d.soundFormat ?? undefined,
            aspectRatio: d.aspectRatio ?? undefined,
            musicRights: d.musicRights ?? undefined,
            spokenLanguages: d.spokenLanguages ?? undefined,
            subtitleLanguages: d.subtitleLanguages ?? undefined,
            synopsisShortIt: d.synopsisShortIt ?? undefined,
            synopsisShortEn: d.synopsisShortEn ?? undefined,
            synopsisLongIt: d.synopsisLongIt ?? undefined,
            synopsisLongEn: d.synopsisLongEn ?? undefined,
          };
          const toMerge = mergeFilmData(
            existing as unknown as Record<string, unknown>,
            incoming as unknown as Record<string, unknown>
          );

          // Attach person IDs only se cambiati
          if (personDirectorId !== existing.personDirectorId) {
            toMerge.personDirectorId = personDirectorId;
          }
          if (personProducerId !== existing.personProducerId) {
            toMerge.personProducerId = personProducerId;
          }

          if (Object.keys(toMerge).length > 0) {
            await tx.film.update({
              where: { id: existing.id },
              data: toMerge,
            });
          }
        }
        filmId = existing.id;
        filmTitle = existing.titleOriginal;
        filmPremiereStatus = existing.premiereStatus;
      } else {
        // create
        const d = payload.film.data;
        if (!d || !d.titleOriginal) {
          throw new Error("action=create richiede 'data.titleOriginal'");
        }

        let personDirectorId: string | null = null;
        let personProducerId: string | null = null;

        if (d.director && (d.director.firstName || d.director.lastName)) {
          const pd = await tx.person.create({
            data: {
              firstName: d.director.firstName ?? "",
              lastName: d.director.lastName ?? "",
              birthDate: parseDate(d.director.birthDate),
              codiceFiscale: d.director.codiceFiscale ?? null,
              partitaIva: d.director.partitaIva ?? null,
              email: d.director.email ?? null,
              phone: d.director.phone ?? null,
              bioIt: d.director.bioIt ?? null,
              bioEn: d.director.bioEn ?? null,
              filmography: d.director.filmography ?? null,
              socialMedia: d.director.socialMedia ?? null,
            },
          });
          personDirectorId = pd.id;
          summary.personDirectorId = pd.id;
        }

        if (d.producer && (d.producer.firstName || d.producer.lastName || d.producer.company)) {
          const pp = await tx.person.create({
            data: {
              firstName: d.producer.firstName ?? "",
              lastName: d.producer.lastName ?? "",
              email: d.producer.email ?? null,
              phone: d.producer.phone ?? null,
              website: d.producer.website ?? null,
              company: d.producer.company ?? null,
              socialMedia: d.producer.socialMedia ?? null,
            },
          });
          personProducerId = pp.id;
          summary.personProducerId = pp.id;
        }

        const directorFullName = d.director
          ? `${d.director.firstName ?? ""} ${d.director.lastName ?? ""}`.trim()
          : "Sconosciuto";

        const createdFilm = await tx.film.create({
          data: {
            titleOriginal: d.titleOriginal,
            titleInternational: d.titleInternational ?? null,
            titleOtherLanguages: d.titleOtherLanguages ?? null,
            director: directorFullName || "Sconosciuto",
            screenwriters: d.screenwriters ?? null,
            year: d.year ?? new Date().getFullYear(),
            duration: d.duration ?? 0,
            genre: d.genre ?? "Sconosciuto",
            country: d.country ?? "Italia",
            productionBudget: d.productionBudget ?? null,
            shootingFormat: d.shootingFormat ?? null,
            soundFormat: d.soundFormat ?? null,
            aspectRatio: d.aspectRatio ?? null,
            musicRights: d.musicRights ?? null,
            spokenLanguages: d.spokenLanguages ?? null,
            subtitleLanguages: d.subtitleLanguages ?? null,
            synopsisShortIt: d.synopsisShortIt ?? null,
            synopsisShortEn: d.synopsisShortEn ?? null,
            synopsisLongIt: d.synopsisLongIt ?? null,
            synopsisLongEn: d.synopsisLongEn ?? null,
            status: "onboarding",
            personDirectorId,
            personProducerId,
          },
        });
        filmId = createdFilm.id;
        filmTitle = createdFilm.titleOriginal;
        filmPremiereStatus = createdFilm.premiereStatus;
      }

      summary.filmId = filmId;

      // ────────────────────────────────────────────────────────────
      // 2. DistributionPlan findOrCreate (serve per submissions + queue)
      // ────────────────────────────────────────────────────────────
      const premiereLevel = mapPremiereLevel(filmPremiereStatus);
      let plan = await tx.distributionPlan.findFirst({
        where: { filmId },
        orderBy: { createdAt: "asc" },
      });
      if (!plan) {
        plan = await tx.distributionPlan.create({
          data: { filmId, premiereLevel, status: "draft" },
        });
      }
      summary.planId = plan.id;

      // ────────────────────────────────────────────────────────────
      // 3. Submissions
      // ────────────────────────────────────────────────────────────
      const dedupResolutions = payload.dedupResolutions ?? {};

      if (payload.submissions && Array.isArray(payload.submissions)) {
        for (const sub of payload.submissions) {
          if (!sub.festivalMasterId) continue;

          const resolution = dedupResolutions[sub.festivalMasterId];
          if (resolution === "skip") {
            summary.submissionsSkipped++;
            continue;
          }

          // Year per edition
          const eventYear = sub.eventDate
            ? new Date(sub.eventDate).getFullYear()
            : sub.deadline
              ? new Date(sub.deadline).getFullYear()
              : new Date().getFullYear();

          // Find or create FestivalEdition
          let edition = await tx.festivalEdition.findFirst({
            where: { festivalMasterId: sub.festivalMasterId, year: eventYear },
          });
          if (!edition) {
            edition = await tx.festivalEdition.create({
              data: {
                festivalMasterId: sub.festivalMasterId,
                festivalName: sub.festivalName ?? null,
                year: eventYear,
                deadlineGeneral: parseDate(sub.deadline),
                notificationDate: parseDate(sub.notificationDate),
                eventStartDate: parseDate(sub.eventDate),
                feeAmount: sub.listPrice ?? null,
              },
            });
            summary.editionsCreated++;
          }

          const status = mapStatus(sub.status);

          // Duplicate?
          const existingSub = await tx.submission.findUnique({
            where: {
              filmId_festivalEditionId: {
                filmId,
                festivalEditionId: edition.id,
              },
            },
          });

          let submissionId: string;

          if (existingSub) {
            if (resolution === "update") {
              const updated = await tx.submission.update({
                where: { id: existingSub.id },
                data: {
                  status,
                  listPrice: sub.listPrice ?? existingSub.listPrice,
                  estimatedFee: sub.estimatedFee ?? existingSub.estimatedFee,
                  feesPaid: sub.feesPaid ?? existingSub.feesPaid,
                  notificationDate:
                    parseDate(sub.notificationDate) ?? existingSub.notificationDate,
                  festivalEventDate:
                    parseDate(sub.eventDate) ?? existingSub.festivalEventDate,
                  notes: sub.notes ?? existingSub.notes,
                },
              });
              submissionId = updated.id;
              summary.submissionsUpdated++;
            } else if (resolution === "duplicate") {
              // "duplicate" = crea comunque nuova — ma @@unique(filmId, festivalEditionId) impedisce.
              // Fallback: aggiorna in modo conservativo (ignora il duplicato, log)
              submissionId = existingSub.id;
              summary.submissionsSkipped++;
            } else {
              // Nessuna risoluzione: skip silenzioso
              submissionId = existingSub.id;
              summary.submissionsSkipped++;
            }
          } else {
            const created = await tx.submission.create({
              data: {
                filmId,
                festivalEditionId: edition.id,
                status,
                listPrice: sub.listPrice ?? null,
                estimatedFee: sub.estimatedFee ?? null,
                feesPaid: sub.feesPaid ?? null,
                submittedAt:
                  status === "submitted" ||
                  status === "accepted" ||
                  status === "rejected"
                    ? parseDate(sub.deadline) ?? new Date()
                    : null,
                notificationDate: parseDate(sub.notificationDate),
                festivalEventDate: parseDate(sub.eventDate),
                notes: sub.notes ?? null,
              },
            });
            submissionId = created.id;
            summary.submissionsCreated++;
          }

          // PlanEntry (ruolo queue per ora — la semantica premiere è gestita diversamente)
          const existingPlanEntry = await tx.planEntry.findUnique({
            where: {
              planId_festivalMasterId: {
                planId: plan.id,
                festivalMasterId: sub.festivalMasterId,
              },
            },
          });
          if (!existingPlanEntry) {
            await tx.planEntry.create({
              data: {
                planId: plan.id,
                festivalMasterId: sub.festivalMasterId,
                festivalEditionId: edition.id,
                role: "queue",
                position: summary.planEntriesCreated,
                status: status === "accepted" ? "approved" : "subscribed",
                estimatedFee: sub.estimatedFee ?? null,
                actualFee: sub.feesPaid ?? null,
                submissionId,
              },
            });
            summary.planEntriesCreated++;
          } else if (!existingPlanEntry.submissionId) {
            // Collega submission al plan entry esistente
            await tx.planEntry.update({
              where: { id: existingPlanEntry.id },
              data: {
                submissionId,
                festivalEditionId: edition.id,
                status: status === "accepted" ? "approved" : "subscribed",
              },
            });
          }

          // FinanceEntry — solo se listPrice o feesPaid presenti
          if (
            (sub.listPrice != null && sub.listPrice > 0) ||
            (sub.feesPaid != null && sub.feesPaid > 0) ||
            (sub.estimatedFee != null && sub.estimatedFee > 0)
          ) {
            const amount = sub.estimatedFee ?? sub.listPrice ?? 0;
            if (amount > 0) {
              await tx.financeEntry.create({
                data: {
                  type: "expense",
                  category: "submission_fee",
                  amount,
                  currency: "EUR",
                  description: `Iscrizione ${sub.festivalName ?? "festival"} — ${filmTitle}`,
                  date:
                    parseDate(sub.deadline) ??
                    parseDate(sub.eventDate) ??
                    new Date(),
                  filmTitle,
                  festivalName: sub.festivalName ?? null,
                  filmId,
                  submissionId,
                },
              });
              summary.financeEntriesCreated++;
            }
          }
        }
      }

      // ────────────────────────────────────────────────────────────
      // 4. Queue entries
      // ────────────────────────────────────────────────────────────
      if (payload.queue && Array.isArray(payload.queue)) {
        let basePosition = summary.planEntriesCreated;
        for (const q of payload.queue) {
          if (!q.festivalMasterId) continue;

          // Check uniqueness (planId + festivalMasterId)
          const existing = await tx.planEntry.findUnique({
            where: {
              planId_festivalMasterId: {
                planId: plan.id,
                festivalMasterId: q.festivalMasterId,
              },
            },
          });
          if (existing) {
            summary.queueEntriesSkipped++;
            continue;
          }

          // Optionally: collega a edition se disponibile
          let editionId: string | null = null;
          if (q.eventDate) {
            const y = new Date(q.eventDate).getFullYear();
            if (!isNaN(y)) {
              const ed = await tx.festivalEdition.findFirst({
                where: { festivalMasterId: q.festivalMasterId, year: y },
                select: { id: true },
              });
              if (ed) editionId = ed.id;
            }
          }

          await tx.planEntry.create({
            data: {
              planId: plan.id,
              festivalMasterId: q.festivalMasterId,
              festivalEditionId: editionId,
              role: "queue",
              position: q.position ?? basePosition++,
              status: "pending",
              priority: q.priority ?? null,
            },
          });
          summary.queueEntriesCreated++;
        }
      }

      return summary;
    });

    return NextResponse.json(
      {
        ok: true,
        summary: result,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Import commit error:", e);
    return NextResponse.json(
      {
        error: `Errore commit: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
