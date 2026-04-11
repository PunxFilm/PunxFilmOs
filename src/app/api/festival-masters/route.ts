import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const festivalMasterCreateSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  country: z.string().min(1, "Il paese è obbligatorio"),
  city: z.string().min(1, "La città è obbligatoria"),
  region: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  classification: z.string().optional(),
  type: z.string().optional(),
  focus: z.string().optional(),
  maxMinutes: z.number().optional(),
  acceptedGenres: z.string().optional(),
  acceptedThemes: z.string().optional(),
  acceptsFirstWork: z.boolean().optional(),
  directorRequirements: z.string().optional(),
  regulationsUrl: z.string().optional(),
  qualityScore: z.number().optional(),
  academyQualifying: z.boolean().optional(),
  baftaQualifying: z.boolean().optional(),
  canadianScreenQualifying: z.boolean().optional(),
  goyaQualifying: z.boolean().optional(),
  efaQualifying: z.boolean().optional(),
  shortFilmConferenceMember: z.boolean().optional(),
  qualifying: z.string().optional(),
  screeningType: z.string().optional(),
  screeningLocation: z.string().optional(),
  screeningQuality: z.string().optional(),
  dcp: z.boolean().optional(),
  industry: z.boolean().optional(),
  maxYearsProduction: z.number().optional(),
  travelSupport: z.string().optional(),
  hospitalitySupport: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactTelephone: z.string().optional(),
  contactEmailDirector: z.string().optional(),
  contactEmailInfo: z.string().optional(),
  contactEmailTechnical: z.string().optional(),
  internalNotes: z.string().optional(),
  punxHistory: z.string().optional(),
  waiverType: z.string().optional(),
  waiverDetails: z.string().optional(),
  submissionUrlBase: z.string().optional(),
  submissionPlatform: z.string().optional(),
  foundedYear: z.number().optional(),
  openingDate: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const classification = searchParams.get("classification") || "";
  const type = searchParams.get("type") || "";
  const country = searchParams.get("country") || "";
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build where clause — SQLite doesn't support case-insensitive contains natively
  const where: any = { isActive: true };
  if (search) {
    // Use multiple contains with different casings for SQLite compatibility
    const searchLower = search.toLowerCase();
    const searchUpper = search.charAt(0).toUpperCase() + search.slice(1);
    where.OR = [
      { name: { contains: search } },
      { name: { contains: searchLower } },
      { name: { contains: searchUpper } },
      { city: { contains: search } },
      { city: { contains: searchLower } },
      { city: { contains: searchUpper } },
      { country: { contains: search } },
      { country: { contains: searchLower } },
      { country: { contains: searchUpper } },
    ];
  }
  if (classification) where.classification = classification;
  if (type) where.type = type;
  if (country) where.country = country;

  const [festivals, total] = await Promise.all([
    prisma.festivalMaster.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { editions: true } },
        editions: {
          orderBy: { year: "desc" },
          take: 1,
          select: {
            id: true,
            year: true,
            deadlineEarly: true,
            deadlineGeneral: true,
            deadlineLate: true,
            deadlineFinal: true,
            notificationDate: true,
            eventStartDate: true,
            eventEndDate: true,
          },
        },
      },
    }),
    prisma.festivalMaster.count({ where }),
  ]);

  return NextResponse.json({ festivals, total });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = festivalMasterCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const festival = await prisma.festivalMaster.create({ data: parsed.data });
    return NextResponse.json(festival, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Errore nella creazione del festival master" },
      { status: 500 }
    );
  }
}
