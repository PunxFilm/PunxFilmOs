import { NextResponse } from "next/server";
import { readXlsxSheets } from "@/lib/import/xlsx-parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File mancante nel campo 'file'" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const sheets = readXlsxSheets(buffer);
    return NextResponse.json({ sheets });
  } catch (e) {
    console.error("Xlsx sheets error:", e);
    return NextResponse.json(
      {
        error: `Errore lettura foglio Excel: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
