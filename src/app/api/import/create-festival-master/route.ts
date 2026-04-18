import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      country?: string;
      city?: string;
      website?: string;
      email?: string;
      category?: string;
    };

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Campo 'name' obbligatorio" },
        { status: 400 }
      );
    }

    const created = await prisma.festivalMaster.create({
      data: {
        name: body.name.trim(),
        country: body.country?.trim() || "Sconosciuto",
        city: body.city?.trim() || "Sconosciuto",
        website: body.website?.trim() || null,
        contactEmailInfo: body.email?.trim() || null,
        classification: body.category?.trim() || null,
        isActive: true,
        verificationStatus: "unverified",
      },
      select: {
        id: true,
        name: true,
        country: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("Create festival master error:", e);
    return NextResponse.json(
      {
        error: `Errore creazione festival: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
