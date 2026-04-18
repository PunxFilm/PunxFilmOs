import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  timezone: z.string().min(1).max(64),
  locale: z.string().min(1).max(8),
  emailAlertsDeadline: z.boolean(),
  emailAlertsResults: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      timezone: true,
      locale: true,
      emailAlertsDeadline: true,
      emailAlertsResults: true,
    },
  });
  return NextResponse.json({ prefs: user });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      timezone: true,
      locale: true,
      emailAlertsDeadline: true,
      emailAlertsResults: true,
    },
  });
  return NextResponse.json({ prefs: user });
}
