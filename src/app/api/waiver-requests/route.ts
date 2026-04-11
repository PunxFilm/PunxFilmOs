import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const festivalMasterId = searchParams.get("festivalMasterId");

  const where = festivalMasterId ? { festivalMasterId } : {};

  const requests = await prisma.waiverRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { festivalMaster: true, festivalEdition: true },
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.festivalMasterId) {
      return NextResponse.json(
        { error: "festivalMasterId obbligatorio" },
        { status: 400 }
      );
    }

    const festival = await prisma.festivalMaster.findUnique({
      where: { id: body.festivalMasterId },
    });
    if (!festival) {
      return NextResponse.json(
        { error: "Festival master non trovato" },
        { status: 404 }
      );
    }

    if (body.festivalEditionId) {
      const edition = await prisma.festivalEdition.findUnique({
        where: { id: body.festivalEditionId },
      });
      if (!edition) {
        return NextResponse.json(
          { error: "Edizione festival non trovata" },
          { status: 404 }
        );
      }
    }

    const status = body.status || "pending";

    const waiverRequest = await prisma.waiverRequest.create({
      data: {
        festivalMasterId: body.festivalMasterId,
        festivalEditionId: body.festivalEditionId || null,
        templateUsed: body.templateUsed || null,
        emailSentTo: body.emailSentTo || null,
        notes: body.notes || null,
        status,
        // If status is "sent", set requestedAt to now
        ...(status === "sent" ? { requestedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(waiverRequest, { status: 201 });
  } catch (err) {
    console.error("Errore creazione waiver request:", err);
    return NextResponse.json(
      { error: "Errore nella creazione della richiesta waiver" },
      { status: 500 }
    );
  }
}
