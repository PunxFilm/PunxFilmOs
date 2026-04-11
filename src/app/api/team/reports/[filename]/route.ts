import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  // Prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Path non valido" }, { status: 400 });
  }
  const filePath = join(process.cwd(), "reports", filename);
  try {
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ filename, content });
  } catch {
    return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
  }
}
