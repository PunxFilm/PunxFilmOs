import * as XLSX from "xlsx";

export interface SheetMeta {
  name: string;
  rowCount: number;
  headers: string[];
}

export interface StrategyRow {
  externalId?: number | null; // colonna "ID"
  festivalName: string;
  deadline?: string | null; // ISO date
  status?: string | null;
  notificationDate?: string | null;
  listPrice?: number | null;
  eventDate?: string | null;
  location?: string | null;
  prize?: string | null;
  submissionLink?: string | null;
  websiteLink?: string | null;
  notes?: string | null;
  feesPaid?: number | null;
}

/**
 * Converte un Excel serial number in ISO date string (YYYY-MM-DD).
 * Gestisce il 1900 leap year bug di Excel sottraendo il corretto offset.
 */
function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  // 25569 = giorni tra 1970-01-01 e l'origine Excel (corretto per bug 1900)
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseDateCell(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return excelSerialToIso(v);
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    // prova parsing diretto
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    // prova formato DD/MM/YYYY
    const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      let year = parseInt(m[3], 10);
      if (year < 100) year += 2000;
      const iso = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
    }
    return trimmed; // ritorna raw se non decifrabile, il server farà validazione
  }
  return null;
}

function parseNumberCell(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[€$£\s]/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseStringCell(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parseIntCell(v: unknown): number | null {
  const n = parseNumberCell(v);
  if (n == null) return null;
  return Math.trunc(n);
}

export function readXlsxSheets(buffer: Buffer): SheetMeta[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const result: SheetMeta[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });
    // Headers: prendi dalla prima riga non vuota
    const ref = sheet["!ref"];
    let headers: string[] = [];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
        const cell = sheet[addr];
        headers.push(cell ? String(cell.v ?? "").trim() : "");
      }
      headers = headers.filter((h) => h.length > 0);
    }
    // fallback: se sheet_to_json ha righe, prendi le chiavi della prima
    if (headers.length === 0 && rows.length > 0) {
      headers = Object.keys(rows[0]);
    }
    result.push({ name, rowCount: rows.length, headers });
  }
  return result;
}

/**
 * Mappatura case-insensitive e flessibile dei nomi colonna alle chiavi StrategyRow.
 */
const COLUMN_ALIASES: Record<keyof StrategyRow, string[]> = {
  externalId: ["id"],
  festivalName: ["nome festival", "festival", "nome"],
  deadline: ["deadline", "scadenza"],
  status: ["status", "stato", "esito"],
  notificationDate: [
    "data notifica",
    "notifica",
    "notification date",
    "notification",
    "data esito",
  ],
  listPrice: ["importo", "list price", "prezzo", "prezzo listino"],
  eventDate: ["festival", "data festival", "data evento", "event date"],
  location: ["luogo", "location", "citta", "città"],
  prize: ["premio", "prize"],
  submissionLink: [
    "link iscrizione",
    "link iscrizioni",
    "submission link",
    "iscrizione",
  ],
  websiteLink: ["link sito", "sito", "website", "website link", "url"],
  notes: ["note", "notes", "commenti"],
  feesPaid: ["fee", "fees paid", "pagato", "fee pagata"],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, " ");
}

function buildHeaderMap(headers: string[]): Partial<Record<keyof StrategyRow, string>> {
  const map: Partial<Record<keyof StrategyRow, string>> = {};
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));

  for (const [key, aliases] of Object.entries(COLUMN_ALIASES) as [
    keyof StrategyRow,
    string[],
  ][]) {
    // Per i campi ambigui (eventDate vs festivalName entrambi "festival"),
    // priorità al match esatto con gli aliases
    for (const alias of aliases) {
      const match = normalized.find((h) => h.norm === alias);
      if (match) {
        // evita doppia assegnazione: se già usato, skip
        if (!Object.values(map).includes(match.raw)) {
          map[key] = match.raw;
          break;
        }
      }
    }
  }

  // Heuristics: se non abbiamo festivalName ma abbiamo "festival", usalo come festivalName
  // (alcuni file hanno solo "Festival" come nome festival, non data evento)
  if (!map.festivalName) {
    const fest = normalized.find((h) => h.norm === "festival");
    if (fest && map.eventDate !== fest.raw) {
      map.festivalName = fest.raw;
    }
  }

  return map;
}

export function parseStrategySheet(
  buffer: Buffer,
  sheetName: string
): StrategyRow[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Foglio "${sheetName}" non trovato`);
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const hmap = buildHeaderMap(headers);

  const result: StrategyRow[] = [];
  for (const row of rows) {
    const get = (k: keyof StrategyRow) => (hmap[k] ? row[hmap[k]!] : null);

    const festivalName = parseStringCell(get("festivalName"));
    // Skippa righe totalmente vuote o senza nome festival
    if (!festivalName) continue;

    result.push({
      externalId: parseIntCell(get("externalId")),
      festivalName,
      deadline: parseDateCell(get("deadline")),
      status: parseStringCell(get("status")),
      notificationDate: parseDateCell(get("notificationDate")),
      listPrice: parseNumberCell(get("listPrice")),
      eventDate: parseDateCell(get("eventDate")),
      location: parseStringCell(get("location")),
      prize: parseStringCell(get("prize")),
      submissionLink: parseStringCell(get("submissionLink")),
      websiteLink: parseStringCell(get("websiteLink")),
      notes: parseStringCell(get("notes")),
      feesPaid: parseNumberCell(get("feesPaid")),
    });
  }

  return result;
}
