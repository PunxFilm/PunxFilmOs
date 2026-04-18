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

      <div className="filters-bar">
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Cerca film o festival…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter"
          style={{ paddingRight: 24 }}
        >
          <option value="">Tutti gli stati</option>
          {PLAN_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="px-6">
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <p className="muted">Caricamento…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <p className="muted">Nessun piano di distribuzione. Crea una nuova strategia.</p>
          </div>
        ) : (
          <div className="col gap-3">
            {filtered.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
