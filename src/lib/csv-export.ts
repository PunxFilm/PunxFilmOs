/**
 * Utility per esportare dataset arbitrari in formato CSV.
 * Pure client-side: genera stringa CSV e triggera download.
 */

export interface CSVColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Escape CSV: wrap con " se contiene , " \n \r, double " interne.
 */
function escapeCSVValue(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV<T>(rows: T[], columns: CSVColumn<T>[]): string {
  const header = columns.map((c) => escapeCSVValue(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns.map((c) => escapeCSVValue(c.value(row))).join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

/**
 * Triggera download del file CSV nel browser (BOM UTF-8 per Excel compatibility).
 */
export function downloadCSV(filename: string, content: string): void {
  // BOM per Excel che altrimenti interpreta come ANSI
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Cleanup async per non rompere il download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Formato date per CSV (ISO short: YYYY-MM-DD, vuoto se null).
 */
export function csvDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
