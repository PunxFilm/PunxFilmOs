/**
 * Helper centralizzato per calcolare la deadline "attiva" di un'edizione festival
 * e i giorni mancanti alla scadenza.
 *
 * L'edizione ha 4 deadline (early, general, late, final) ordinate nel tempo.
 * La deadline "attiva" è la prima che NON è ancora passata rispetto a una data di riferimento.
 * Se tutte sono passate (oppure l'edizione non ne ha nessuna), il risultato è `null`.
 */

export type DeadlineType = "early" | "general" | "late" | "final";

export interface EditionDeadlineFields {
  deadlineEarly?: Date | string | null;
  deadlineGeneral?: Date | string | null;
  deadlineLate?: Date | string | null;
  deadlineFinal?: Date | string | null;
}

export interface ActiveDeadline {
  type: DeadlineType;
  date: Date;
  daysToDeadline: number; // può essere negativo se la deadline è appena passata (ma non dovrebbe succedere)
}

/**
 * Converte un valore di campo deadline (string ISO o Date) in Date | null.
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Restituisce la prossima deadline attiva relative a `referenceDate` (default: oggi).
 * Ordine di preferenza quando più deadline sono in futuro: la più vicina (early → final).
 */
export function computeActiveDeadline(
  edition: EditionDeadlineFields,
  referenceDate: Date = new Date()
): ActiveDeadline | null {
  const candidates: Array<{ type: DeadlineType; date: Date }> = (
    [
      { type: "early" as const, date: toDate(edition.deadlineEarly) },
      { type: "general" as const, date: toDate(edition.deadlineGeneral) },
      { type: "late" as const, date: toDate(edition.deadlineLate) },
      { type: "final" as const, date: toDate(edition.deadlineFinal) },
    ] as const
  ).filter(
    (c): c is { type: DeadlineType; date: Date } => c.date !== null
  );

  // Prendi la prima deadline >= referenceDate
  const upcoming = candidates
    .filter((c) => c.date.getTime() >= referenceDate.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysToDeadline = Math.ceil((next.date.getTime() - referenceDate.getTime()) / msPerDay);

  return {
    type: next.type,
    date: next.date,
    daysToDeadline,
  };
}

/**
 * Restituisce i campi da aggiornare su un'edizione per sincronizzare
 * `activeDeadlineType`, `activeDeadlineDate`, `daysToDeadline`.
 * Se non c'è alcuna deadline futura, ritorna i tre campi a null.
 */
export function computeActiveDeadlineFields(
  edition: EditionDeadlineFields,
  referenceDate: Date = new Date()
): {
  activeDeadlineType: DeadlineType | null;
  activeDeadlineDate: Date | null;
  daysToDeadline: number | null;
} {
  const active = computeActiveDeadline(edition, referenceDate);
  if (!active) {
    return {
      activeDeadlineType: null,
      activeDeadlineDate: null,
      daysToDeadline: null,
    };
  }
  return {
    activeDeadlineType: active.type,
    activeDeadlineDate: active.date,
    daysToDeadline: active.daysToDeadline,
  };
}

/**
 * Classifica un'edizione in una fascia di urgenza.
 *   - past: deadline già passata (o nessuna)
 *   - urgent: <= 7 giorni
 *   - soon: 8-30 giorni
 *   - comfortable: 31-90 giorni
 *   - far: > 90 giorni
 */
export type DeadlineUrgency = "past" | "urgent" | "soon" | "comfortable" | "far";

export function classifyUrgency(daysToDeadline: number | null | undefined): DeadlineUrgency {
  if (daysToDeadline == null || daysToDeadline < 0) return "past";
  if (daysToDeadline <= 7) return "urgent";
  if (daysToDeadline <= 30) return "soon";
  if (daysToDeadline <= 90) return "comfortable";
  return "far";
}
