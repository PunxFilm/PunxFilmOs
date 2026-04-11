"use client";

import Link from "next/link";

export interface CalendarEvent {
  id: string;
  date: string; // ISO date
  title: string;
  type:
    | "early_deadline"
    | "regular_deadline"
    | "late_deadline"
    | "event_start"
    | "event_end"
    | "notification";
  festivalMasterId: string;
  color: string; // tailwind class
}

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const MAX_VISIBLE_EVENTS = 3;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function CalendarGrid({ year, month, events }: CalendarGridProps) {
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Day of week for the first day (0=Sun, adjust to Mon-start)
  const firstDayOfWeek = firstDay.getDay();
  // Convert: 0(Sun)->6, 1(Mon)->0, 2(Tue)->1 ... 6(Sat)->5
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Days from previous month to fill the first row
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevDays: { day: number; date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    prevDays.push({
      day: d,
      date: new Date(year, month - 1, d),
      isCurrentMonth: false,
    });
  }

  // Current month days
  const currentDays: { day: number; date: Date; isCurrentMonth: boolean }[] =
    [];
  for (let d = 1; d <= totalDays; d++) {
    currentDays.push({
      day: d,
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Days from next month to fill the last row
  const allSoFar = prevDays.length + currentDays.length;
  const remaining = allSoFar % 7 === 0 ? 0 : 7 - (allSoFar % 7);
  const nextDays: { day: number; date: Date; isCurrentMonth: boolean }[] = [];
  for (let d = 1; d <= remaining; d++) {
    nextDays.push({
      day: d,
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  const allDays = [...prevDays, ...currentDays, ...nextDays];

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const dateKey = ev.date.slice(0, 10);
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(ev);
  }

  function dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
      {/* Header row */}
      <div className="grid grid-cols-7 bg-[var(--secondary)]">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium text-[var(--muted-foreground)]"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {allDays.map((cell, idx) => {
          const key = dateKey(cell.date);
          const dayEvents = eventsByDate.get(key) || [];
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflowCount = dayEvents.length - MAX_VISIBLE_EVENTS;
          const today = isToday(cell.date);

          return (
            <div
              key={idx}
              className={`min-h-[90px] border-t border-r border-[var(--border)] p-1.5 ${
                !cell.isCurrentMonth ? "bg-[var(--secondary)]/30" : ""
              }`}
              style={
                !cell.isCurrentMonth
                  ? { backgroundColor: "var(--secondary)", opacity: 0.4 }
                  : undefined
              }
            >
              {/* Day number */}
              <div className="flex items-center justify-end mb-1">
                <span
                  className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    today
                      ? "ring-2 ring-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : cell.isCurrentMonth
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {cell.day}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {visibleEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/festivals/${ev.festivalMasterId}`}
                    className={`block truncate text-[10px] leading-tight px-1 py-0.5 rounded ${ev.color} hover:opacity-80 transition-opacity`}
                    title={`${ev.title} (${typeLabel(ev.type)})`}
                  >
                    {ev.title}
                  </Link>
                ))}
                {overflowCount > 0 && (
                  <div className="text-[10px] text-[var(--muted-foreground)] px-1">
                    +{overflowCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function typeLabel(
  type: CalendarEvent["type"]
): string {
  switch (type) {
    case "early_deadline":
      return "Early Deadline";
    case "regular_deadline":
      return "Deadline";
    case "late_deadline":
      return "Late Deadline";
    case "event_start":
      return "Inizio Evento";
    case "event_end":
      return "Fine Evento";
    case "notification":
      return "Notifica";
  }
}
