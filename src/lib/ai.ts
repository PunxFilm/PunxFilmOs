import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic };

export const anthropic =
  globalForAnthropic.anthropic ||
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}

export const AI_MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 8192;

/**
 * Prefill string da usare come primo token dell'assistant message per forzare
 * Claude a produrre solo JSON. Combinato con parseAIResponse garantisce
 * parsing robusto anche quando il modello è tentato di aggiungere prosa.
 * Uso: messages: [{role: "user", content: ...}, {role: "assistant", content: JSON_PREFILL}]
 * parseAIResponse aggiunge il "{" iniziale prima di parsare.
 */
export const JSON_PREFILL = "{";

/**
 * Estrae il primo oggetto JSON bilanciato da una stringa, anche se circondato
 * da prosa, markdown fences, commenti trailing, etc.
 *
 * Strategia:
 *  1. Rimuove ```json fences
 *  2. Se inizia con "{" o "[" prova JSON.parse diretto
 *  3. Altrimenti fa brace/bracket matching con awareness di stringhe ed escape
 *  4. Se tutto fallisce ritorna errore con snippet contestuale
 */
export function parseAIResponse<T>(content: string, prefilled = false): T {
  // Se abbiamo usato prefill "{", il contenuto restituito non include la "{" iniziale
  const raw = prefilled ? "{" + content : content;

  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Fast path: stringa già JSON pulito
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Cadi su brace matching
  }

  // Trova il primo oggetto o array JSON bilanciato
  const extracted = extractBalancedJson(cleaned);
  if (extracted) {
    try {
      return JSON.parse(extracted) as T;
    } catch (e) {
      throw new Error(
        `JSON estratto ma invalido: ${(e as Error).message}. Snippet: ${extracted.slice(0, 200)}`
      );
    }
  }

  throw new Error(
    `Impossibile estrarre JSON dalla risposta AI. Snippet: ${cleaned.slice(0, 300)}`
  );
}

/**
 * Trova il primo oggetto/array JSON bilanciato nella stringa. Rispetta
 * stringhe JSON e escape. Ritorna null se non trova nulla di bilanciato.
 */
function extractBalancedJson(s: string): string | null {
  // Cerca il primo "{" o "[" e matcha la sua chiusura
  const startIdx = s.search(/[{[]/);
  if (startIdx === -1) return null;

  const openChar = s[startIdx];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) return s.slice(startIdx, i + 1);
    }
  }
  return null; // JSON non bilanciato — documento troncato
}
