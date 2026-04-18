"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  urgentCount: number;
  oscarOpenCount: number;
  freeEntryCount: number;
  budgetPlanned: number;
}

const CARDS: Array<{
  key: keyof Stats;
  icon: string;
  label: string;
  hint: string;
  href: string;
  color: string;
}> = [
  {
    key: "urgentCount",
    icon: "⚡",
    label: "Urgenti",
    hint: "Deadline ≤ 7 giorni",
    href: "/festivals?urgency=urgent",
    color: "from-red-100 to-red-50 border-red-200",
  },
  {
    key: "oscarOpenCount",
    icon: "🏆",
    label: "Oscar aperti",
    hint: "Qualifying con deadline futura",
    href: "/festivals?qualifying=oscar&hasDeadline=true",
    color: "from-rose-100 to-rose-50 border-rose-200",
  },
  {
    key: "freeEntryCount",
    icon: "💰",
    label: "Free entry",
    hint: "Submission gratuite aperte",
    href: "/festivals?feeMax=0&hasDeadline=true",
    color: "from-emerald-100 to-emerald-50 border-emerald-200",
  },
  {
    key: "budgetPlanned",
    icon: "📋",
    label: "Budget pianificato",
    hint: "Fee totali dei miei piani",
    href: "/strategies",
    color: "from-sky-100 to-sky-50 border-sky-200",
  },
];

function formatValue(key: keyof Stats, value: number): string {
  if (key === "budgetPlanned") {
    return `€${Math.round(value).toLocaleString("it-IT")}`;
  }
  return value.toLocaleString("it-IT");
}

export function KpiCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/festival-editions/stats")
      .then((r) => r.json())
      .then((data: Stats) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {CARDS.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className={`block p-4 rounded-lg border bg-gradient-to-br hover:shadow-md transition-shadow ${card.color}`}
        >
          <div className="flex items-start justify-between">
            <span className="text-2xl" aria-hidden="true">
              {card.icon}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">
              {card.hint}
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-bold mt-2 text-[var(--foreground)]">
            {loading ? "…" : stats ? formatValue(card.key, stats[card.key]) : "—"}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">{card.label}</p>
        </Link>
      ))}
    </div>
  );
}
