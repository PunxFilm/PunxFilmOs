import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WAIVER_TEMPLATES, fillTemplate } from "@/lib/waiver-templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, festivalMasterId, festivalEditionId } = body;

    if (!templateId || !festivalMasterId) {
      return NextResponse.json(
        { error: "templateId e festivalMasterId obbligatori" },
        { status: 400 }
      );
    }

    const template = WAIVER_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template non trovato" },
        { status: 404 }
      );
    }

    const festival = await prisma.festivalMaster.findUnique({
      where: { id: festivalMasterId },
    });
    if (!festival) {
      return NextResponse.json(
        { error: "Festival master non trovato" },
        { status: 404 }
      );
    }

    let editionYear = new Date().getFullYear().toString();
    if (festivalEditionId) {
      const edition = await prisma.festivalEdition.findUnique({
        where: { id: festivalEditionId },
      });
      if (edition) {
        editionYear = edition.year.toString();
      }
    }

    // Count films in distribution or onboarding
    const catalogueCount = await prisma.film.count({
      where: {
        status: { in: ["in_distribuzione", "onboarding"] },
      },
    });

    const vars: Record<string, string> = {
      festivalName: festival.name,
      editionYear,
      distributorName: "PunxFilm",
      distributorEmail: "distribution@punxfilm.com",
      distributorWebsite: "www.punxfilm.com",
      catalogueCount: catalogueCount.toString(),
    };

    const { subject, body: emailBody } = fillTemplate(template, vars);
    const to =
      festival.contactEmailInfo || festival.contactEmailDirector || "";

    return NextResponse.json({ subject, body: emailBody, to });
  } catch (err) {
    console.error("Errore generazione email waiver:", err);
    return NextResponse.json(
      { error: "Errore nella generazione dell'email" },
      { status: 500 }
    );
  }
}
