"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { CalendarGrid, CalendarEvent } from "@/components/calendar-grid";

const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const TYPE_LEGEND: { type: CalendarEvent["type"]; label: string; color: string }[] = [
  { type: "early_deadline", label: "Early Deadline", color: "bg-amber-100 text-amber-800" },
  { type: "regular_deadline", label: "Deadline", color: "bg-blue-100 text-blue-800" },
  { type: "late_deadline", label: "Late Deadline", color: "bg-orange-100 text-orange-800" },
  { type: "event_start", label: "Inizio Evento", color: "bg-green-100 text-green-800" },
  { type: "event_end", label: "Fine Evento", color: "bg-green-50 text-green-600" },
  { type: "notification", label: "Notifica", color: "bg-purple-100 text-purple-800" },
];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventCount, setEventCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar?year=${year}&month=${month + 1}`
      );
      const data = await res.json();
      const evts: CalendarEvent[] = data.events ?? [];
      setEvents(evts);
      setEventCount(evts.length);
    } catch {
      setEvents([]);
      setEventCount(0);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function goToPrev() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNext() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario"
        subtitle={
          loading
            ? "Caricamento..."
            : `${eventCount} ${eventCount === 1 ? "evento" : "eventi"} questo mese`
        }
      />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
          >
            &larr;
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={goToNext}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
          >
            &rarr;
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
        >
          Oggi
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {TYPE_LEGEND.map(({ type, label, color }) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3 h-3 rounded-sm ${color.split(" ")[0]}`}
            />
            <span className="text-xs text-[var(--muted-foreground)]">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">
            Caricamento calendario...
          </p>
        </div>
      ) : (
        <CalendarGrid year={year} month={month} events={events} />
      )}
    </div>
  );
}
