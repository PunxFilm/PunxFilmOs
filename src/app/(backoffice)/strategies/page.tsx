"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PlanCard } from "@/components/plan-card";
import { PLAN_STATUS_OPTIONS } from "@/lib/constants";

interface PlanEntry {
  id: string;
  role: string;
  status: string;
  position: number;
  estimatedFee: number | null;
  festivalMaster: { name: string };
}

interface Plan {
  id: string;
  premiereLevel: string;
  status: string;
  film: { titleOriginal: string; director: string; genre: string; duration: number };
  entries: PlanEntry[];
}

export default function StrategiesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/distribution-plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      });
  }, []);

  const filtered = plans.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.film.titleOriginal.toLowerCase().includes(q) ||
      p.entries.some((e) => e.festivalMaster.name.toLowerCase().includes(q));
    const matchesFilter = !filter || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategie"
        subtitle={`${filtered.length} piani di distribuzione`}
        action={{ label: "Nuova Strategia", href: "/strategies/wizard" }}
      />

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Cerca film o festival..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Tutti gli stati</option>
          {PLAN_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">Caricamento...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">
            Nessun piano di distribuzione. Crea una nuova strategia.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
