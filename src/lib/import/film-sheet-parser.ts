import mammoth from "mammoth";
import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  anthropic,
  AI_MODEL,
  MAX_TOKENS,
  parseAIResponse,
  JSON_PREFILL,
} from "@/lib/ai";

const FILM_SHEET_PROMPT = `Sei un estrattore dati specializzato in schede film italiane (template Trilathera/PunxFilm).
Analizza il testo ed estrai TUTTI i dati in JSON. Se manca, usa null.
Durata in minuti (numero). Anno come numero. Budget come numero puro (senza €).

{
  "titleOriginal": "...",
  "titleInternational": "...",
  "titleOtherLanguages": "...",
  "director": { "firstName": "...", "lastName": "...", "birthDate": "YYYY-MM-DD", "codiceFiscale": "...", "partitaIva": "...", "email": "...", "phone": "...", "bioIt": "...", "bioEn": "...", "filmography": "...", "socialMedia": "..." },
  "producer": { "firstName": "...", "lastName": "...", "company": "...", "email": "...", "phone": "...", "website": "...", "socialMedia": "..." },
  "screenwriters": "...",
  "duration": null,
  "genre": "...",
  "country": "...",
  "year": null,
  "productionBudget": null,
  "shootingFormat": "...",
  "soundFormat": "...",
  "aspectRatio": "...",
  "musicRights": "...",
  "spokenLanguages": "...",
  "subtitleLanguages": "...",
  "synopsisShortIt": "...",
  "synopsisShortEn": "...",
  "synopsisLongIt": "...",
  "synopsisLongEn": "...",
  "cast": [{ "actor": "...", "role": "..." }]
}`;

export interface FilmSheetPerson {
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  codiceFiscale?: string | null;
  partitaIva?: string | null;
  email?: string | null;
  phone?: string | null;
  bioIt?: string | null;
  bioEn?: string | null;
  filmography?: string | null;
  socialMedia?: string | null;
  company?: string | null;
  website?: string | null;
}

export interface FilmSheetCastEntry {
  actor?: string | null;
  role?: string | null;
}

export interface FilmSheetData {
  titleOriginal?: string | null;
  titleInternational?: string | null;
  titleOtherLanguages?: string | null;
  director?: FilmSheetPerson | null;
  producer?: FilmSheetPerson | null;
  screenwriters?: string | null;
  duration?: number | null;
  genre?: string | null;
  country?: string | null;
  year?: number | null;
  productionBudget?: number | null;
  shootingFormat?: string | null;
  soundFormat?: string | null;
  aspectRatio?: string | null;
  musicRights?: string | null;
  spokenLanguages?: string | null;
  subtitleLanguages?: string | null;
  synopsisShortIt?: string | null;
  synopsisShortEn?: string | null;
  synopsisLongIt?: string | null;
  synopsisLongEn?: string | null;
  cast?: FilmSheetCastEntry[] | null;
}

function pdfToText(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `pdftotext "${path}" -`,
      { maxBuffer: 10 * 1024 * 1024 },
      (err, out) => {
        if (err) reject(err);
        else resolve(out);
      }
    );
  });
}

export async function parseFilmSheet(
  buffer: Buffer,
  filename: string
): Promise<FilmSheetData> {
  const lower = filename.toLowerCase();
  let text = "";

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (lower.endsWith(".pdf")) {
    const tmp = join(tmpdir(), `punxfilm-${randomUUID()}.pdf`);
    await writeFile(tmp, buffer);
    try {
      text = await pdfToText(tmp);
    } finally {
      await unlink(tmp).catch(() => {});
    }
  } else if (lower.endsWith(".doc")) {
    // .doc legacy: mammoth non supporta, ritenta come txt best-effort
    throw new Error(
      "Formato .doc non supportato. Converti in .docx o PDF prima di caricare."
    );
  } else {
    throw new Error(`Formato non supportato: ${filename}`);
  }

  if (!text || text.trim().length < 10) {
    throw new Error("Impossibile estrarre testo dal file");
  }

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: MAX_TOKENS,
    system: FILM_SHEET_PROMPT,
    messages: [
      { role: "user", content: text.slice(0, 20000) },
      { role: "assistant", content: JSON_PREFILL },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Risposta AI non valida");
  }

  return parseAIResponse<FilmSheetData>(content.text, true);
}
