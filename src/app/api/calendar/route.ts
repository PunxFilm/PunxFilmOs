import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CalendarEventDTO {
  id: string;
  date: string;
  title: string;
  type:
    | "early_deadline"
    | "regular_deadline"
    | "late_deadline"
    | "event_start"
    | "event_end"
    | "notification";
  festivalMasterId: string;
  color: string;
}

const EVENT_COLORS: Record<CalendarEventDTO["type"], string> = {
  early_deadline: "bg-amber-100 text-amber-800",
  regular_deadline: "bg-blue-100 text-blue-800",
  late_deadline: "bg-orange-100 text-orange-800",
  event_start: "bg-green-100 text-green-800",
  event_end: "bg-green-50 text-green-600",
  notification: "bg-purple-100 text-purple-800",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  if (!yearParam || !monthParam) {
    return NextResponse.json(
      { error: "Parametri year e month obbligatori" },
      { status: 400 }
    );
  }

  const year = parseInt(yearParam);
  const month = parseInt(monthParam); // 1-indexed from the client

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Valori year/month non validi" },
      { status: 400 }
    );
  }

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    const editions = await prisma.festivalEdition.findMany({
      where: {
        OR: [
          { deadlineEarly: { gte: startOfMonth, lte: endOfMonth } },
          { deadlineGeneral: { gte: startOfMonth, lte: endOfMonth } },
          { deadlineLate: { gte: startOfMonth, lte: endOfMonth } },
          { eventStartDate: { gte: startOfMonth, lte: endOfMonth } },
          { eventEndDate: { gte: startOfMonth, lte: endOfMonth } },
          { notificationDate: { gte: startOfMonth, lte: endOfMonth } },
        ],
      },
      include: {
        festivalMaster: {
          select: { id: true, name: true },
        },
      },
    });

    const events: CalendarEventDTO[] = [];

    for (const edition of editions) {
      const name = edition.festivalName || edition.festivalMaster.name;
      const masterId = edition.festivalMaster.id;

      const dateFields: {
        field: keyof typeof edition;
        type: CalendarEventDTO["type"];
      }[] = [
        { field: "deadlineEarly", type: "early_deadline" },
        { field: "deadlineGeneral", type: "regular_deadline" },
        { field: "deadlineLate", type: "late_deadline" },
        { field: "eventStartDate", type: "event_start" },
        { field: "eventEndDate", type: "event_end" },
        { field: "notificationDate", type: "notification" },
      ];

      for (const { field, type } of dateFields) {
        const dateValue = edition[field] as Date | null;
        if (dateValue) {
          const d = new Date(dateValue);
          // Only include if it falls within the requested month
          if (d >= startOfMonth && d <= endOfMonth) {
            events.push({
              id: `${edition.id}-${type}`,
              date: d.toISOString(),
              title: name,
              type,
              festivalMasterId: masterId,
              color: EVENT_COLORS[type],
            });
          }
        }
      }
    }

    // Sort by date
    events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Errore nel caricamento eventi calendario:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento degli eventi" },
      { status: 500 }
    );
  }
}
