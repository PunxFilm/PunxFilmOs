import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const festival = await prisma.festivalMaster.findUnique({
    where: { id: params.id },
    include: {
      editions: {
        orderBy: { year: "desc" },
        include: {
          submissions: {
            include: { film: { select: { id: true, titleOriginal: true } } },
          },
        },
      },
      planEntries: {
        include: {
          plan: {
            include: {
              film: { select: { id: true, titleOriginal: true } },
            },
          },
        },
        take: 20,
      },
      _count: { select: { editions: true, planEntries: true } },
      waiverRequests: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!festival) {
    return NextResponse.json(
      { error: "Festival master non trovato" },
      { status: 404 }
    );
  }
  return NextResponse.json(festival);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const festival = await prisma.festivalMaster.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(festival);
  } catch {
    return NextResponse.json(
      { error: "Festival master non trovato" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.festivalMaster.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Festival master non trovato" },
      { status: 404 }
    );
  }
}
