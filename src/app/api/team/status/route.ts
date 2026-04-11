import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  // KPIs from database
  const [
    festivalTotal,
    festivalVerified,
    festivalUnverified,
    editionCount,
    filmCount,
    submissionCount,
    planCount,
    taskCount,
    expenses,
    income,
  ] = await Promise.all([
    prisma.festivalMaster.count({ where: { isActive: true } }),
    prisma.festivalMaster.count({ where: { isActive: true, verificationStatus: "verified" } }),
    prisma.festivalMaster.count({ where: { isActive: true, verificationStatus: "unverified" } }),
    prisma.festivalEdition.count(),
    prisma.film.count(),
    prisma.submission.count(),
    prisma.distributionPlan.count(),
    prisma.task.count({ where: { status: { not: "done" } } }),
    prisma.financeEntry.aggregate({ _sum: { amount: true }, where: { type: "expense" } }),
    prisma.financeEntry.aggregate({ _sum: { amount: true }, where: { type: "income" } }),
  ]);

  // Research rotation info
  let rotation = null;
  try {
    const rotationPath = join(process.cwd(), "reports", ".research-rotation.json");
    const rotationData = await readFile(rotationPath, "utf-8");
    rotation = JSON.parse(rotationData);
  } catch {
    /* no rotation file */
  }

  // Latest report per type
  const reportsDir = join(process.cwd(), "reports");
  const latestReports: Record<string, string> = {};
  try {
    const files = await readdir(reportsDir);
    for (const f of files) {
      if (!f.endsWith(".md") || f.startsWith(".")) continue;
      const type = f.replace(/-\d{4}-\d{2}-\d{2}\.md$/, "").replace(/\.md$/, "");
      if (!latestReports[type] || f > latestReports[type]) {
        latestReports[type] = f;
      }
    }
  } catch {
    /* no reports dir */
  }

  return NextResponse.json({
    kpis: {
      festivalTotal,
      festivalVerified,
      festivalUnverified,
      editionCount,
      filmCount,
      submissionCount,
      planCount,
      taskCount,
      totalExpenses: expenses._sum.amount || 0,
      totalIncome: income._sum.amount || 0,
    },
    rotation,
    latestReports,
  });
}
