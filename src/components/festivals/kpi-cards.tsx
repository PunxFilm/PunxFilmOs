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
  label: string;
  hint: string;
  href: string;
  tone?: string;
}> = [
  {
    key: "urgentCount",
    label: "Urgenti",
    hint: "Deadline ≤ 7 giorni",
    href: "/festivals?urgency=urgent",
    tone: "var(--accent)",
  },
  {
    key: "oscarOpenCount",
    label: "Oscar qualifying",
    hint: "Con deadline futura",
    href: "/festivals?qualifying=oscar&hasDeadline=true",
    tone: "var(--warn)",
  },
  {
    key: "freeEntryCount",
    label: "Free entry",
    hint: "Submission gratuite aperte",
    href: "/festivals?feeMax=0&hasDeadline=true",
    tone: "var(--ok)",
  },
  {
    key: "budgetPlanned",
    label: "Budget pianificato",
    hint: "Fee totali dei miei piani",
    href: "/strategies",
    tone: "var(--info)",
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
    <div className="grid-4">
      {CARDS.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="kpi"
          style={{ textDecoration: "none", display: "block" }}
        >
          <div className="kpi-label">{card.label}</div>
          <div className="kpi-value" style={{ color: card.tone }}>
            {loading ? "…" : stats ? formatValue(card.key, stats[card.key]) : "—"}
          </div>
          <div className="kpi-sub">{card.hint}</div>
        </Link>
      ))}
    </div>
  );
}
