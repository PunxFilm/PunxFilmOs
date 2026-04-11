import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    const persons = await prisma.person.findMany({
      where,
      orderBy: { lastName: "asc" },
      include: {
        _count: {
          select: { filmsAsDirector: true, filmsAsProducer: true },
        },
      },
    });

    return NextResponse.json(persons);
  } catch (e) {
    console.error("Persons GET error:", e);
    return NextResponse.json(
      { error: "Errore nel recupero delle persone" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.firstName && !body.lastName) {
      return NextResponse.json(
        { error: "Nome o cognome obbligatorio" },
        { status: 400 }
      );
    }

    const person = await prisma.person.create({
      data: {
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        codiceFiscale: body.codiceFiscale || null,
        partitaIva: body.partitaIva || null,
        email: body.email || null,
        phone: body.phone || null,
        website: body.website || null,
        bioIt: body.bioIt || null,
        bioEn: body.bioEn || null,
        filmography: body.filmography || null,
        socialMedia: body.socialMedia || null,
        company: body.company || null,
        companyRole: body.companyRole || null,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (e) {
    console.error("Persons POST error:", e);
    return NextResponse.json(
      { error: "Errore nella creazione della persona" },
      { status: 500 }
    );
  }
}
