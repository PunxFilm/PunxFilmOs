import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const editionCreateSchema = z.object({
  year: z.number().int().min(1900, "Anno non valido"),
  editionNumber: z.number().int().optional(),
  festivalName: z.string().optional(),
  lifecycleStatus: z.string().optional(),
  openingDate: z.coerce.date().optional(),
  deadlineEarly: z.coerce.date().optional(),
  deadlineGeneral: z.coerce.date().optional(),
  deadlineLate: z.coerce.date().optional(),
  deadlineFinal: z.coerce.date().optional(),
  deadlineRaw: z.string().optional(),
  activeDeadlineType: z.string().optional(),
  activeDeadlineDate: z.coerce.date().optional(),
  notificationDate: z.coerce.date().optional(),
  notificationDateRaw: z.string().optional(),
  eventStartDate: z.coerce.date().optional(),
  eventEndDate: z.coerce.date().optional(),
  eventPeriodRaw: z.string().optional(),
  feeAmountRaw: z.string().optional(),
  feeAmount: z.number().optional(),
  feeLateFee: z.number().optional(),
  feeCurrency: z.string().optional(),
  docuFeeRaw: z.string().optional(),
  docuFeeAmount: z.number().optional(),
  screeningFee: z.number().optional(),
  prizeRaw: z.string().optional(),
  prizeCash: z.number().optional(),
  prizeService: z.string().optional(),
  prizeDescription: z.string().optional(),
  docuPrizeRaw: z.string().optional(),
  premiereRules: z.string().optional(),
  durationRules: z.string().optional(),
  categoryRules: z.string().optional(),
  regulationsText: z.string().optional(),
  sectionCategories: z.string().optional(),
  themes: z.string().optional(),
  waiverPolicy: z.string().optional(),
  waiverCode: z.string().optional(),
  waiverNotes: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const editions = await prisma.festivalEdition.findMany({
    where: { festivalMasterId: params.id },
    orderBy: { year: "desc" },
  });
  return NextResponse.json(editions);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica che il festival master esista
    const master = await prisma.festivalMaster.findUnique({
      where: { id: params.id },
    });
    if (!master) {
      return NextResponse.json(
        { error: "Festival master non trovato" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = editionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const edition = await prisma.festivalEdition.create({
      data: {
        ...parsed.data,
        festivalMasterId: params.id,
      },
    });
    return NextResponse.json(edition, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Errore nella creazione dell'edizione" },
      { status: 500 }
    );
  }
}
