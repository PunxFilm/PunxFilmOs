/**
 * Daily cron endpoint: ricalcola activeDeadlineType/Date/daysToDeadline
 * su tutte le FestivalEdition.
 *
 * Chiamato da GitHub Actions (.github/workflows/cron-fill-deadlines.yml)
 * con header `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Env richieste:
 *  - CRON_SECRET: token condiviso con GitHub Actions
 *  - DATABASE_URL: iniettata da Railway al deploy
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fillActiveDeadlines } from "@/lib/fill-deadlines-core";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 }
    );
  }

  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await fillActiveDeadlines(prisma, new Date());
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    console.error("[cron/fill-deadlines] failed:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
