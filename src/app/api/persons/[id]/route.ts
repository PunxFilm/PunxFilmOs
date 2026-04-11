import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const person = await prisma.person.findUnique({
      where: { id: params.id },
      include: {
        filmsAsDirector: { select: { id: true, titleOriginal: true, year: true } },
        filmsAsProducer: { select: { id: true, titleOriginal: true, year: true } },
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: "Persona non trovata" },
        { status: 404 }
      );
    }

    return NextResponse.json(person);
  } catch {
    return NextResponse.json(
      { error: "Errore nel recupero della persona" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Build update data only from provided fields
    const data: Record<string, unknown> = {};
    if (body.firstName !== undefined) data.firstName = body.firstName;
    if (body.lastName !== undefined) data.lastName = body.lastName;
    if (body.birthDate !== undefined) data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    if (body.codiceFiscale !== undefined) data.codiceFiscale = body.codiceFiscale;
    if (body.partitaIva !== undefined) data.partitaIva = body.partitaIva;
    if (body.email !== undefined) data.email = body.email;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.website !== undefined) data.website = body.website;
    if (body.bioIt !== undefined) data.bioIt = body.bioIt;
    if (body.bioEn !== undefined) data.bioEn = body.bioEn;
    if (body.filmography !== undefined) data.filmography = body.filmography;
    if (body.socialMedia !== undefined) data.socialMedia = body.socialMedia;
    if (body.company !== undefined) data.company = body.company;
    if (body.companyRole !== undefined) data.companyRole = body.companyRole;

    const person = await prisma.person.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(person);
  } catch {
    return NextResponse.json(
      { error: "Persona non trovata" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.person.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Persona non trovata" },
      { status: 404 }
    );
  }
}
