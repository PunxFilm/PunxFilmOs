export function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT");
}

export function isUrgent(d: Date | string | null, days = 7): boolean {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff < days * 24 * 60 * 60 * 1000;
}

export function isPast(d: Date | string | null): boolean {
  if (!d) return false;
  return new Date(d).getTime() < Date.now();
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return `€${amount.toFixed(2)}`;
}

export function daysUntil(d: Date | string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function parseCommaSeparated(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Formatta durata in minuti decimali come MM:SS o HH:MM:SS
 * Es: 11.83 → "11:50", 98.5 → "01:38:30", 4 → "04:00"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes && minutes !== 0) return "—";
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Parsa stringa durata HH:MM:SS o MM:SS in minuti decimali
 * Es: "11:50" → 11.833, "01:38:30" → 98.5, "23:59" → 23.983
 */
export function parseDuration(value: string): number {
  const parts = value.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  if (parts.length === 2) {
    return parts[0] + parts[1] / 60;
  }
  return Number(value) || 0;
}

/**
 * Calcola lo status automatico di un'edizione festival basato sulle date
 */
export interface EditionStatusResult {
  status: string;
  label: string;
  color: string; // tailwind class
  nextDeadline: string | null; // ISO date della prossima deadline rilevante
  countdown: string | null; // "tra 3 giorni", "scaduto da 2 giorni"
}

export function computeEditionStatus(edition: {
  deadlineEarly?: string | Date | null;
  deadlineGeneral?: string | Date | null;
  deadlineLate?: string | Date | null;
  deadlineFinal?: string | Date | null;
  notificationDate?: string | Date | null;
  eventStartDate?: string | Date | null;
  eventEndDate?: string | Date | null;
}): EditionStatusResult {
  const now = new Date();
  const toDate = (v: string | Date | null | undefined) => v ? new Date(v) : null;

  const early = toDate(edition.deadlineEarly);
  const regular = toDate(edition.deadlineGeneral);
  const late = toDate(edition.deadlineLate);
  const final = toDate(edition.deadlineFinal);
  const notification = toDate(edition.notificationDate);
  const eventStart = toDate(edition.eventStartDate);
  const eventEnd = toDate(edition.eventEndDate);

  // Find the latest applicable deadline
  const allDeadlines = [early, regular, late, final].filter(Boolean) as Date[];
  const latestDeadline = allDeadlines.length > 0 ? allDeadlines[allDeadlines.length - 1] : null;

  const formatCountdown = (target: Date): string => {
    const days = Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return "oggi";
    if (days === 1) return "domani";
    if (days > 0) return `tra ${days} giorni`;
    if (days === -1) return "ieri";
    return `${Math.abs(days)} giorni fa`;
  };

  // Post-event
  if (eventEnd && now > eventEnd) {
    return { status: "completed", label: "Completato", color: "bg-gray-100 text-gray-600", nextDeadline: null, countdown: null };
  }

  // During event
  if (eventStart && eventEnd && now >= eventStart && now <= eventEnd) {
    return { status: "in_corso", label: "In corso", color: "bg-purple-100 text-purple-800", nextDeadline: eventEnd.toISOString(), countdown: `Termina ${formatCountdown(eventEnd)}` };
  }

  // Selection phase (after all deadlines, before event)
  if (notification && now >= notification && eventStart && now < eventStart) {
    return { status: "selection", label: "Selezioni", color: "bg-blue-100 text-blue-800", nextDeadline: eventStart.toISOString(), countdown: `Evento ${formatCountdown(eventStart)}` };
  }

  // After all deadlines, waiting notification
  if (latestDeadline && now > latestDeadline) {
    if (notification && now < notification) {
      return { status: "closed", label: "Chiuso", color: "bg-gray-100 text-gray-700", nextDeadline: notification.toISOString(), countdown: `Notifiche ${formatCountdown(notification)}` };
    }
    // No notification date or past it, before event
    if (eventStart && now < eventStart) {
      return { status: "closed", label: "Chiuso", color: "bg-gray-100 text-gray-700", nextDeadline: eventStart.toISOString(), countdown: `Evento ${formatCountdown(eventStart)}` };
    }
    return { status: "closed", label: "Chiuso", color: "bg-gray-100 text-gray-700", nextDeadline: null, countdown: null };
  }

  // Late deadline open
  if (late && regular && now > regular && now <= late) {
    return { status: "late_open", label: "Late deadline", color: "bg-orange-100 text-orange-800", nextDeadline: late.toISOString(), countdown: `Scade ${formatCountdown(late)}` };
  }

  // Regular deadline open
  if (regular && (!early || now > early) && now <= regular) {
    return { status: "regular_open", label: "Aperto", color: "bg-green-100 text-green-800", nextDeadline: regular.toISOString(), countdown: `Scade ${formatCountdown(regular)}` };
  }

  // Early deadline open
  if (early && now <= early) {
    return { status: "early_open", label: "Early bird", color: "bg-emerald-100 text-emerald-800", nextDeadline: early.toISOString(), countdown: `Early ${formatCountdown(early)}` };
  }

  // No dates available
  if (allDeadlines.length === 0 && !eventStart) {
    return { status: "unknown", label: "Date mancanti", color: "bg-gray-100 text-gray-500", nextDeadline: null, countdown: null };
  }

  // Fallback: if we have a regular deadline in the future
  if (regular && now < regular) {
    return { status: "regular_open", label: "Aperto", color: "bg-green-100 text-green-800", nextDeadline: regular.toISOString(), countdown: `Scade ${formatCountdown(regular)}` };
  }

  return { status: "unknown", label: "Sconosciuto", color: "bg-gray-100 text-gray-500", nextDeadline: null, countdown: null };
}
