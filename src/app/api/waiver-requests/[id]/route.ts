import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const waiverRequest = await prisma.waiverRequest.findUnique({
    where: { id: params.id },
    include: { festivalMaster: true, festivalEdition: true },
  });

  if (!waiverRequest) {
    return NextResponse.json(
      { error: "Richiesta waiver non trovata" },
      { status: 404 }
    );
  }

  return NextResponse.json(waiverRequest);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const existing = await prisma.waiverRequest.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Richiesta waiver non trovata" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (body.status !== undefined) data.status = body.status;
    if (body.waiverCode !== undefined) data.waiverCode = body.waiverCode;
    if (body.waiverType !== undefined) data.waiverType = body.waiverType;
    if (body.discountPercentage !== undefined) data.discountPercentage = body.discountPercentage;
    if (body.respondedAt !== undefined) data.respondedAt = body.respondedAt;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.emailSentTo !== undefined) data.emailSentTo = body.emailSentTo;
    if (body.templateUsed !== undefined) data.templateUsed = body.templateUsed;

    // When status changes to "approved", also update the FestivalMaster
    if (body.status === "approved") {
      data.respondedAt = new Date();

      const waiverType = body.waiverType || "code";
      const waiverDetails = body.waiverCode
        ? `Codice: ${body.waiverCode}`
        : body.waiverType === "agreement"
          ? "Accordo waiver"
          : null;

      await prisma.festivalMaster.update({
        where: { id: existing.festivalMasterId },
        data: {
          waiverType: waiverType === "free" ? "code" : waiverType,
          waiverDetails,
        },
      });
    }

    // When status changes to "rejected", set respondedAt
    if (body.status === "rejected" && !data.respondedAt) {
      data.respondedAt = new Date();
    }

    const updated = await prisma.waiverRequest.update({
      where: { id: params.id },
      data,
      include: { festivalMaster: true, festivalEdition: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Errore aggiornamento waiver request:", err);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento della richiesta waiver" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.waiverRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Richiesta waiver non trovata" },
      { status: 404 }
    );
  }
}
