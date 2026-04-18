"use client";

import { useState, useEffect } from "react";

export interface FestivalsFilters {
  search: string;
  year: string;
  classification: string;
  type: string;
  country: string;
  qualifying: string;
  hasDeadline: boolean;
  feeMax: string;
  urgency: string;
  planStatus: string;
  filmId: string;
  onlyCompatible: boolean;
}

export const EMPTY_FILTERS: FestivalsFilters = {
  search: "",
  year: "",
  classification: "",
  type: "",
  country: "",
  qualifying: "",
  hasDeadline: false,
  feeMax: "",
  urgency: "",
  planStatus: "",
  filmId: "",
  onlyCompatible: false,
};

interface FiltersBarProps {
  filters: FestivalsFilters;
  onChange: (next: FestivalsFilters) => void;
  total: number;
  filteredCount: number;
  rightSlot?: React.ReactNode;
}

const CLASSIFICATIONS = [
  { value: "", label: "Tutte le classificazioni" },
  { value: "A-list", label: "A-list" },
  { value: "B-list", label: "B-list" },
  { value: "C-list", label: "C-list" },
  { value: "qualifying", label: "Qualifying" },
  { value: "regional", label: "Regional" },
  { value: "niche", label: "Niche" },
];

const TYPES = [
  { value: "", label: "Tutti i tipi" },
  { value: "short", label: "Cortometraggi" },
  { value: "feature", label: "Lungometraggi" },
  { value: "mixed", label: "Mixed" },
  { value: "documentary", label: "Documentari" },
  { value: "animation", label: "Animazione" },
  { value: "genre", label: "Genre" },
];

const YEARS = [
  { value: "", label: "Anno (tutti attivi)" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
];

export function FiltersBar({
  filters,
  onChange,
  total,
  filteredCount,
  rightSlot,
}: FiltersBarProps) {
  const [searchLocal, setSearchLocal] = useState(filters.search);

  // Sync da prop (es. dopo reset esterno)
  useEffect(() => {
    setSearchLocal(filters.search);
  }, [filters.search]);

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchLocal !== filters.search) {
        onChange({ ...filters, search: searchLocal });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocal]);

  const set = <K extends keyof FestivalsFilters>(key: K, value: FestivalsFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const activeChipsCount = [
    filters.qualifying && 1,
    filters.urgency === "urgent" && 1,
    filters.country === "Italia" && 1,
    filters.feeMax === "0" && 1,
    filters.planStatus && 1,
  ].filter(Boolean).length;

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.year ? 1 : 0) +
    (filters.classification ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.qualifying ? 1 : 0) +
    (filters.hasDeadline ? 1 : 0) +
    (filters.feeMax ? 1 : 0) +
    (filters.urgency ? 1 : 0) +
    (filters.planStatus ? 1 : 0) +
    (filters.onlyCompatible ? 1 : 0);

  return (
    <div className="sticky top-0 md:top-0 z-10 bg-[var(--background)] pb-3 pt-1 space-y-3 border-b border-[var(--border)]">
      {/* Search + right slot (view toggle) */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="🔎 Cerca festival, città o paese…"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        {rightSlot}
      </div>

      {/* Quick chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.filmId && (
          <Chip
            active={filters.onlyCompatible}
            onClick={() => set("onlyCompatible", !filters.onlyCompatible)}
            color="emerald"
          >
            🎯 Solo compatibili
          </Chip>
        )}
        <Chip
          active={filters.urgency === "urgent"}
          onClick={() => set("urgency", filters.urgency === "urgent" ? "" : "urgent")}
          color="red"
        >
          ⚡ Urgenti (≤7gg)
        </Chip>
        <Chip
          active={filters.urgency === "soon"}
          onClick={() => set("urgency", filters.urgency === "soon" ? "" : "soon")}
          color="amber"
        >
          ⏰ Entro 30gg
        </Chip>
        <Chip
          active={filters.qualifying === "oscar"}
          onClick={() => set("qualifying", filters.qualifying === "oscar" ? "" : "oscar")}
          color="rose"
        >
          🏆 Oscar
        </Chip>
        <Chip
          active={filters.qualifying === "bafta"}
          onClick={() => set("qualifying", filters.qualifying === "bafta" ? "" : "bafta")}
          color="emerald"
        >
          🏆 BAFTA
        </Chip>
        <Chip
          active={filters.qualifying === "efa"}
          onClick={() => set("qualifying", filters.qualifying === "efa" ? "" : "efa")}
          color="sky"
        >
          🏆 EFA
        </Chip>
        <Chip
          active={filters.country === "Italia"}
          onClick={() => set("country", filters.country === "Italia" ? "" : "Italia")}
          color="blue"
        >
          🇮🇹 Italia
        </Chip>
        <Chip
          active={filters.feeMax === "0"}
          onClick={() => set("feeMax", filters.feeMax === "0" ? "" : "0")}
          color="emerald"
        >
          💰 Free entry
        </Chip>
        <Chip
          active={filters.planStatus === "planned"}
          onClick={() =>
            set("planStatus", filters.planStatus === "planned" ? "" : "planned")
          }
          color="amber"
        >
          📋 I miei piani
        </Chip>
      </div>

      {/* Secondary dropdowns + counter */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterSelect
          value={filters.year}
          onChange={(v) => set("year", v)}
          options={YEARS}
        />
        <FilterSelect
          value={filters.classification}
          onChange={(v) => set("classification", v)}
          options={CLASSIFICATIONS}
        />
        <FilterSelect
          value={filters.type}
          onChange={(v) => set("type", v)}
          options={TYPES}
        />
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Pulisci filtri ({activeFiltersCount})
          </button>
        )}
        <div className="ml-auto text-sm text-[var(--muted-foreground)]">
          {filteredCount === total ? (
            <span>
              <span className="font-medium text-[var(--foreground)]">{total}</span> edizioni
            </span>
          ) : (
            <span>
              <span className="font-medium text-[var(--foreground)]">{filteredCount}</span> di{" "}
              {total}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: "red" | "amber" | "rose" | "emerald" | "sky" | "blue";
  children: React.ReactNode;
}) {
  const activeColors: Record<string, string> = {
    red: "bg-red-100 text-red-800 border-red-300",
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    rose: "bg-rose-100 text-rose-800 border-rose-300",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-300",
    sky: "bg-sky-100 text-sky-800 border-sky-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? activeColors[color]
          : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--muted-foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
