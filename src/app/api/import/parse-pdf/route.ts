import { NextResponse } from "next/server";
import { anthropic, AI_MODEL, parseAIResponse, JSON_PREFILL } from "@/lib/ai";
import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const MAX_TOKENS = 16384;

const FILM_SHEET_PROMPT = `Sei un assistente specializzato nell'estrazione dati da schede film italiane.
Analizza il testo fornito e estrai TUTTI i dati disponibili nel seguente formato JSON.
Se un campo non è presente nel testo, usa null.
Per la durata, convertila in minuti con decimali (es. 11:50 = 11.83).
Per l'anno, estrai l'anno di produzione.
Per il budget, estrai il valore numerico.

Rispondi ESCLUSIVAMENTE con JSON valido, senza commenti o testo aggiuntivo.

Formato:
{
  "titleOriginal": "...",
  "titleInternational": "...",
  "titleOtherLanguages": "...",
  "director": { "firstName": "...", "lastName": "...", "birthDate": "...", "codiceFiscale": "...", "partitaIva": "...", "email": "...", "phone": "...", "bioIt": "...", "bioEn": "...", "filmography": "...", "socialMedia": "..." },
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
  "synopsisLongEn": "..."
}`;

const STRATEGY_PROMPT = `Sei un assistente specializzato nell'estrazione dati da documenti di strategia distributiva per cortometraggi.
Analizza il testo e SEPARA i dati in due categorie:

1. "submissions" — Festival a cui il film è GIÀ STATO ISCRITTO. Hanno status "Selected", "Not Selected", o "Undecided" con deadline già passate e notification date.
2. "queue" — Festival in CODA, non ancora iscritti. Tipicamente tutti con status "Undecided" e deadline future. Sono festival pianificati ma l'iscrizione non è ancora stata fatta.

REGOLA CHIAVE per distinguere:
- Se il documento si chiama "Iscrizioni" o contiene festival con status "Selected"/"Not Selected" → sono SUBMISSIONS (iscrizioni già fatte)
- Se il documento si chiama "Coda" o contiene solo "Undecided" con deadline future → sono QUEUE (coda pianificata)
- Se un festival ha status "Undecided" ma la deadline è già passata → è una SUBMISSION (è stato iscritto, in attesa di risposta)

Per lo status delle submissions usa:
- "Not Selected" se rifiutato
- "Selected" se selezionato/accettato
- "Undecided" se in attesa di risposta (già iscritto)

Date in formato YYYY-MM-DD. Fee come numeri. Se non disponibile, usa null.
Includi TUTTI i festival trovati nel testo.

Rispondi ESCLUSIVAMENTE con JSON valido:
{
  "submissions": [
    { "festivalName": "...", "deadline": "YYYY-MM-DD", "status": "Not Selected", "notificationDate": "YYYY-MM-DD", "estimatedFee": 22.15, "festivalEventDate": "YYYY-MM-DD", "location": "...", "prizeAmount": null }
  ],
  "queue": [
    { "festivalName": "...", "deadline": "YYYY-MM-DD", "estimatedFee": 5.00, "festivalEventDate": "YYYY-MM-DD", "location": "...", "prizeAmount": null }
  ]
}`;

function pdfToText(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`pdftotext "${filePath}" -`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function POST(request: Request) {
  const tempFiles: string[] = [];
  try {
    const formData = await request.formData();
    const results: { fileName: string; type: string; data: Record<string, unknown> }[] = [];

    // Process all files in the form data
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (!(value instanceof File)) continue;

      const file = value;
      const type = key.includes("strategy") || key.includes("strategia") ? "strategy" : "film_sheet";

      // Save to temp file
      const tempPath = join(tmpdir(), `punxfilm-${randomUUID()}.pdf`);
      tempFiles.push(tempPath);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(tempPath, buffer);

      // Extract text
      let text: string;
      try {
        text = await pdfToText(tempPath);
      } catch {
        // If pdftotext fails, try reading as text directly
        text = buffer.toString("utf-8");
      }

      if (!text || text.trim().length < 10) {
        results.push({ fileName: file.name, type, data: { error: "Impossibile estrarre testo dal PDF" } });
        continue;
      }

      // Send to AI con prefill "{" per forzare JSON-only
      const systemPrompt = type === "film_sheet" ? FILM_SHEET_PROMPT : STRATEGY_PROMPT;
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          { role: "user", content: text.slice(0, 15000) },
          { role: "assistant", content: JSON_PREFILL },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        results.push({ fileName: file.name, type, data: { error: "Risposta AI non valida" } });
        continue;
      }

      try {
        const parsed = parseAIResponse<Record<string, unknown>>(content.text, true);
        results.push({ fileName: file.name, type, data: parsed });
      } catch (parseErr) {
        console.error(
          `JSON parse error for ${file.name}:`,
          parseErr,
          "\nRaw AI response:",
          content.text.slice(0, 500)
        );
        results.push({
          fileName: file.name,
          type,
          data: {
            error: `Parse AI fallito: ${
              parseErr instanceof Error ? parseErr.message : String(parseErr)
            }`,
          },
        });
      }
    }

    // Also support JSON body with text (legacy)
    if (entries.length === 0) {
      const body = await request.json().catch(() => null);
      if (body?.text && body?.type) {
        const systemPrompt = body.type === "film_sheet" ? FILM_SHEET_PROMPT : STRATEGY_PROMPT;
        const response = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [
            { role: "user", content: body.text.slice(0, 15000) },
            { role: "assistant", content: JSON_PREFILL },
          ],
        });
        const content = response.content[0];
        if (content.type === "text") {
          try {
            const parsed = parseAIResponse<Record<string, unknown>>(content.text, true);
            results.push({ fileName: "text", type: body.type, data: parsed });
          } catch (parseErr) {
            console.error("JSON parse error (legacy text body):", parseErr, "\nRaw:", content.text.slice(0, 500));
            results.push({
              fileName: "text",
              type: body.type,
              data: { error: `Parse AI fallito: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}` },
            });
          }
        }
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Parse PDF error:", e);
    return NextResponse.json(
      { error: `Errore nel parsing: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  } finally {
    // Cleanup temp files
    for (const f of tempFiles) {
      await unlink(f).catch(() => {});
    }
  }
}
