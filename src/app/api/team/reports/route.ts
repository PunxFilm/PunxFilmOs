import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";

export async function GET() {
  const reportsDir = join(process.cwd(), "reports");
  try {
    const files = await readdir(reportsDir);
    const reports = await Promise.all(
      files
        .filter(f => f.endsWith(".md") && !f.startsWith("."))
        .map(async (filename) => {
          const fileStat = await stat(join(reportsDir, filename));
          // Extract type from filename pattern: morning-report, deadline-report, festival-research, org-chart
          const type = filename.replace(/-\d{4}-\d{2}-\d{2}\.md$/, "").replace(/\.md$/, "");
          // Extract date from filename if present
          const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
          return {
            filename,
            type,
            date: dateMatch ? dateMatch[1] : null,
            size: fileStat.size,
            modifiedAt: fileStat.mtime.toISOString(),
          };
        })
    );
    // Sort by date descending, then by modified date
    reports.sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return b.modifiedAt.localeCompare(a.modifiedAt);
    });
    return NextResponse.json(reports);
  } catch {
    return NextResponse.json([]);
  }
}
