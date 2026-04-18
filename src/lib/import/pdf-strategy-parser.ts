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
import type { StrategyRow } from "./xlsx-parser";

const SUBMISSIONS_PROMPT = `Estrai la tabella delle iscrizioni festival (festival a cui il film è GIÀ iscritto).
Per ogni riga ritorna campi: externalId (numero), festivalName (string), deadline (YYYY-MM-DD), status ("Not Selected" | "Selected" | "Undecided"), notificationDate (YYYY-MM-DD), listPrice (numero, colonna Importo/prezzo listino), feesPaid (numero, colonna Fee pagata al festival), eventDate (YYYY-MM-DD), location, prize, submissionLink, websiteLink, notes. Se manca, null.

Rispondi ESCLUSIVAMENTE con JSON valido:
{"rows":[{"externalId":null,"festivalName":"...","deadline":"YYYY-MM-DD","status":"Not Selected","notificationDate":null,"listPrice":null,"feesPaid":null,"eventDate":null,"location":null,"prize":null,"submissionLink":null,"websiteLink":null,"notes":null}]}`;

const QUEUE_PROMPT = `Estrai la lista di festival CANDIDATI (in coda, non ancora iscritti — tipicamente status Undecided e deadline future).
Stesso shape delle iscrizioni ma status è facoltativo (tutti implicitamente "Undecided"). Tutti i campi opzionali null se mancanti.

Rispondi ESCLUSIVAMENTE con JSON valido:
{"rows":[{"externalId":null,"festivalName":"...","deadline":"YYYY-MM-DD","status":null,"notificationDate":null,"listPrice":null,"feesPaid":null,"eventDate":null,"location":null,"prize":null,"submissionLink":null,"websiteLink":null,"notes":null}]}`;

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

export async function parsePdfStrategy(
  buffer: Buffer,
  kind: "submissions" | "queue"
): Promise<StrategyRow[]> {
  const tmp = join(tmpdir(), `punxfilm-${randomUUID()}.pdf`);
  await writeFile(tmp, buffer);

  let text = "";
  try {
    text = await pdfToText(tmp);
  } finally {
    await unlink(tmp).catch(() => {});
  }

  if (!text || text.trim().length < 10) {
    throw new Error("Impossibile estrarre testo dal PDF");
  }

  const prompt = kind === "submissions" ? SUBMISSIONS_PROMPT : QUEUE_PROMPT;
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: MAX_TOKENS,
    system: prompt,
    messages: [
      { role: "user", content: text.slice(0, 20000) },
      { role: "assistant", content: JSON_PREFILL },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Risposta AI non valida");
  }

  const parsed = parseAIResponse<{ rows: StrategyRow[] }>(content.text, true);
  if (!parsed.rows || !Array.isArray(parsed.rows)) {
    return [];
  }
  // Sanity filter: rimuovi righe senza festivalName
  return parsed.rows.filter((r) => r && typeof r.festivalName === "string" && r.festivalName.trim() !== "");
}
