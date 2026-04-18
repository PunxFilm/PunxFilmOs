"use client";

import { classifyUrgency } from "@/lib/deadline-helpers";
import { useNow } from "@/hooks/use-now";

interface DeadlineBadgeProps {
  date: string | Date | null;
  daysToDeadline: number | null;
  type?: string | null; // early|general|late|final
  size?: "sm" | "md";
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formatta il countdown in "Ngg Xh" o "Xh Ymin" quando molto vicino.
 */
function formatLiveCountdown(deadlineDate: Date, now: Date): string {
  const msDiff = deadlineDate.getTime() - now.getTime();
  if (msDiff <= 0) return "scaduta";

  const totalMinutes = Math.floor(msDiff / 60_000);
  const totalHours = Math.floor(msDiff / 3_600_000);
  const days = Math.floor(msDiff / 86_400_000);

  if (days >= 1) {
    const hours = totalHours - days * 24;
    return `${days}gg ${hours}h`;
  }
  if (totalHours >= 1) {
    const minutes = totalMinutes - totalHours * 60;
    return `${totalHours}h ${minutes}min`;
  }
  return `${totalMinutes}min`;
}

export function DeadlineBadge({
  date,
  daysToDeadline,
  type,
  size = "sm",
}: DeadlineBadgeProps) {
  // Refresh ogni 60s solo per deadline vicine (≤7gg)
  const shouldTickLive =
    daysToDeadline != null && daysToDeadline >= 0 && daysToDeadline <= 7;
  const now = useNow(shouldTickLive ? 60_000 : 3_600_000);

  if (!date || daysToDeadline == null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
        <span>—</span>
      </span>
    );
  }

  const deadlineDate = typeof date === "string" ? new Date(date) : date;
  // Ricalcola days live (potrebbe essere passato 1 giorno)
  const msDiff = deadlineDate.getTime() - now.getTime();
  const liveDays =
    msDiff > 0 ? Math.ceil(msDiff / 86_400_000) : -1;
  const urgency = classifyUrgency(liveDays);

  const styles: Record<string, string> = {
    urgent: "bg-red-100 text-red-800 border-red-300 animate-pulse",
    soon: "bg-amber-100 text-amber-800 border-amber-300",
    comfortable: "bg-emerald-100 text-emerald-800 border-emerald-300",
    far: "bg-blue-50 text-blue-800 border-blue-200",
    past: "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]",
  };

  const labelText =
    shouldTickLive && liveDays >= 0
      ? formatLiveCountdown(deadlineDate, now)
      : urgency === "past"
        ? "scaduta"
        : `${liveDays}gg`;

  const typeLabel = type && type !== "none" ? ` · ${type.toUpperCase()}` : "";

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap w-fit ${styles[urgency]}`}
      >
        {urgency === "urgent" && <span aria-hidden="true">⚡</span>}
        {labelText}
        {size === "md" && typeLabel && (
          <span className="opacity-70">{typeLabel}</span>
        )}
      </span>
      <span className="text-[11px] text-[var(--muted-foreground)] truncate">
        {formatDateShort(deadlineDate)}
        {size === "sm" && typeLabel && (
          <span className="opacity-60">{typeLabel}</span>
        )}
      </span>
    </div>
  );
}
