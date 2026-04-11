import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const edition = await prisma.festivalEdition.findUnique({
    where: { id: params.id },
    include: { festivalMaster: true },
  });
  if (!edition) {
    return NextResponse.json(
      { error: "Edizione non trovata" },
      { status: 404 }
    );
  }
  return NextResponse.json(edition);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const edition = await prisma.festivalEdition.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(edition);
  } catch {
    return NextResponse.json(
      { error: "Edizione non trovata" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.festivalEdition.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Edizione non trovata" },
      { status: 404 }
    );
  }
}
