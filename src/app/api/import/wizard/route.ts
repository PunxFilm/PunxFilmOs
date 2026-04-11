import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function mapSubmissionStatus(status: string): string {
  const s = status?.toLowerCase();
  if (s === "accepted" || s === "selected") return "accepted";
  if (s === "rejected" || s === "not selected") return "rejected";
  if (s === "submitted") return "submitted";
  return "draft";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { film, director, producer, contract, submissions, queueEntries } = body;

    if (!film || !film.titleOriginal) {
      return NextResponse.json(
        { error: "Dati film obbligatori (titleOriginal richiesto)" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const summary = {
        personDirectorId: null as string | null,
        personProducerId: null as string | null,
        filmId: "",
        contractId: null as string | null,
        planId: "",
        submissionsCreated: 0,
        editionsCreated: 0,
        planEntriesCreated: 0,
        financeEntriesCreated: 0,
        queueEntriesCreated: 0,
      };

      // 1. Create Person (director) if provided
      if (director && (director.firstName || director.lastName)) {
        const personDirector = await tx.person.create({
          data: {
            firstName: director.firstName || "",
            lastName: director.lastName || "",
            birthDate: parseDate(director.birthDate),
            codiceFiscale: director.codiceFiscale || null,
            partitaIva: director.partitaIva || null,
            email: director.email || null,
            phone: director.phone || null,
            bioIt: director.bioIt || null,
            bioEn: director.bioEn || null,
            filmography: director.filmography || null,
            socialMedia: director.socialMedia || null,
          },
        });
        summary.personDirectorId = personDirector.id;
      }

      // 2. Create Person (producer) if provided
      if (producer && (producer.firstName || producer.lastName)) {
        const personProducer = await tx.person.create({
          data: {
            firstName: producer.firstName || "",
            lastName: producer.lastName || "",
            email: producer.email || null,
            phone: producer.phone || null,
            website: producer.website || null,
            company: producer.company || null,
            socialMedia: producer.socialMedia || null,
          },
        });
        summary.personProducerId = personProducer.id;
      }

      // 3. Create Film with personDirectorId and personProducerId
      const directorFullName = director
        ? `${director.firstName || ""} ${director.lastName || ""}`.trim()
        : film.director || "Sconosciuto";

      const createdFilm = await tx.film.create({
        data: {
          titleOriginal: film.titleOriginal,
          titleInternational: film.titleInternational || null,
          titleOtherLanguages: film.titleOtherLanguages || null,
          director: directorFullName,
          screenwriters: film.screenwriters || null,
          year: film.year || new Date().getFullYear(),
          duration: film.duration || 0,
          genre: film.genre || "Sconosciuto",
          country: film.country || "Italia",
          productionBudget: film.productionBudget || null,
          shootingFormat: film.shootingFormat || null,
          soundFormat: film.soundFormat || null,
          aspectRatio: film.aspectRatio || null,
          musicRights: film.musicRights || null,
          spokenLanguages: film.spokenLanguages || null,
          subtitleLanguages: film.subtitleLanguages || null,
          synopsisShortIt: film.synopsisShortIt || null,
          synopsisShortEn: film.synopsisShortEn || null,
          synopsisLongIt: film.synopsisLongIt || null,
          synopsisLongEn: film.synopsisLongEn || null,
          status: "onboarding",
          personDirectorId: summary.personDirectorId,
          personProducerId: summary.personProducerId,
        },
      });
      summary.filmId = createdFilm.id;

      // 4. Create DistributionContract if provided
      if (contract && contract.distributorName) {
        const createdContract = await tx.distributionContract.create({
          data: {
            filmId: createdFilm.id,
            distributorName: contract.distributorName,
            clientName: contract.clientName || directorFullName,
            clientEmail: contract.clientEmail || null,
            startDate: parseDate(contract.startDate) || new Date(),
            endDate: parseDate(contract.endDate) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: "active",
            notes: contract.notes || null,
          },
        });
        summary.contractId = createdContract.id;
      }

      // 5. Create DistributionPlan for the film
      const plan = await tx.distributionPlan.create({
        data: {
          filmId: createdFilm.id,
          premiereLevel: "world",
          status: "draft",
        },
      });
      summary.planId = plan.id;

      // 6. Process submissions
      if (submissions && Array.isArray(submissions)) {
        let position = 0;
        for (const sub of submissions) {
          if (!sub.festivalMasterId) continue;

          // 6a. Find or create FestivalEdition
          const eventYear = sub.festivalEventDate
            ? new Date(sub.festivalEventDate).getFullYear()
            : new Date().getFullYear();

          let edition = await tx.festivalEdition.findFirst({
            where: {
              festivalMasterId: sub.festivalMasterId,
              year: eventYear,
            },
          });

          if (!edition) {
            edition = await tx.festivalEdition.create({
              data: {
                festivalMasterId: sub.festivalMasterId,
                festivalName: sub.festivalName || null,
                year: eventYear,
                deadlineGeneral: parseDate(sub.deadline),
                notificationDate: parseDate(sub.notificationDate),
                eventStartDate: parseDate(sub.festivalEventDate),
                feeAmount: sub.estimatedFee || null,
              },
            });
            summary.editionsCreated++;
          }

          // 6b. Create Submission record
          const submission = await tx.submission.create({
            data: {
              filmId: createdFilm.id,
              festivalEditionId: edition.id,
              status: mapSubmissionStatus(sub.status),
              platform: sub.platform || null,
              submittedAt: sub.status === "submitted" || sub.status === "accepted" || sub.status === "rejected"
                ? parseDate(sub.deadline) || new Date()
                : null,
              estimatedFee: sub.estimatedFee || null,
              feesPaid: sub.actualFee || null,
              notificationDate: parseDate(sub.notificationDate),
              festivalEventDate: parseDate(sub.festivalEventDate),
              prizeAmount: sub.prizeAmount || null,
              notes: sub.notes || null,
            },
          });
          summary.submissionsCreated++;

          // 6c. Create PlanEntry linked to submission
          await tx.planEntry.create({
            data: {
              planId: plan.id,
              festivalMasterId: sub.festivalMasterId,
              festivalEditionId: edition.id,
              role: "queue",
              position: position++,
              status: sub.status === "accepted" ? "approved" : "pending",
              estimatedFee: sub.estimatedFee || null,
              actualFee: sub.actualFee || null,
              submissionId: submission.id,
            },
          });
          summary.planEntriesCreated++;

          // 6d. If estimatedFee > 0: create FinanceEntry (income - fee addebitata al cliente)
          if (sub.estimatedFee && sub.estimatedFee > 0) {
            await tx.financeEntry.create({
              data: {
                type: "income",
                category: "submission_fee",
                amount: sub.estimatedFee,
                currency: "EUR",
                description: `Fee iscrizione ${sub.festivalName || "festival"} - ${createdFilm.titleOriginal}`,
                date: parseDate(sub.deadline) || new Date(),
                filmTitle: createdFilm.titleOriginal,
                festivalName: sub.festivalName || null,
              },
            });
            summary.financeEntriesCreated++;
          }

          // 6e. If actualFee > 0: create FinanceEntry (expense - fee pagata al festival)
          if (sub.actualFee && sub.actualFee > 0) {
            await tx.financeEntry.create({
              data: {
                type: "expense",
                category: "submission_fee",
                amount: sub.actualFee,
                currency: "EUR",
                description: `Fee pagata ${sub.festivalName || "festival"} - ${createdFilm.titleOriginal}`,
                date: parseDate(sub.deadline) || new Date(),
                filmTitle: createdFilm.titleOriginal,
                festivalName: sub.festivalName || null,
              },
            });
            summary.financeEntriesCreated++;
          }
        }
      }

      // 7. Process queue entries
      if (queueEntries && Array.isArray(queueEntries)) {
        let queuePosition = submissions ? submissions.length : 0;
        for (const q of queueEntries) {
          if (!q.festivalMasterId) continue;

          await tx.planEntry.create({
            data: {
              planId: plan.id,
              festivalMasterId: q.festivalMasterId,
              role: "queue",
              position: queuePosition++,
              status: "pending",
              estimatedFee: q.estimatedFee || null,
            },
          });
          summary.queueEntriesCreated++;
        }
      }

      return summary;
    });

    return NextResponse.json({
      ok: true,
      message: "Import completato con successo",
      summary: result,
    }, { status: 201 });
  } catch (e) {
    console.error("Import wizard error:", e);
    return NextResponse.json(
      { error: `Errore nell'import: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
