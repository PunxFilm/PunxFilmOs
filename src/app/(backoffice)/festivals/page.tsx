"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  FiltersBar,
  EMPTY_FILTERS,
  type FestivalsFilters,
} from "@/components/festivals/filters-bar";
import { ViewToggle, type FestivalsView } from "@/components/festivals/view-toggle";
import { FestivalsTable } from "@/components/festivals/festivals-table";
import { FestivalsCards } from "@/components/festivals/festivals-cards";
import { FilmSelector } from "@/components/festivals/film-selector";
import { KpiCards } from "@/components/festivals/kpi-cards";
import { BulkActionsBar } from "@/components/festivals/bulk-actions-bar";
import type { EditionListItem, SortState } from "@/components/festivals/types";

const PAGE_SIZES = [50, 100, 200];

export default function FestivalsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FestivalsPageInner />
    </Suspense>
  );
}

function FestivalsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- State derived from URL ---
  const filters = useMemo<FestivalsFilters>(
    () => ({
      search: searchParams.get("search") || "",
      year: searchParams.get("year") || "",
      classification: searchParams.get("classification") || "",
      type: searchParams.get("type") || "",
      country: searchParams.get("country") || "",
      qualifying: searchParams.get("qualifying") || "",
      hasDeadline: searchParams.get("hasDeadline") === "true",
      feeMax: searchParams.get("feeMax") || "",
      urgency: searchParams.get("urgency") || "",
      planStatus: searchParams.get("planStatus") || "",
      filmId: searchParams.get("filmId") || "",
      onlyCompatible: searchParams.get("onlyCompatible") === "true",
    }),
    [searchParams]
  );

  const sort: SortState = useMemo(
    () => ({
      key: searchParams.get("sort") || "deadline",
      direction: (searchParams.get("direction") as "asc" | "desc") || "asc",
    }),
    [searchParams]
  );

  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const view = (searchParams.get("view") as FestivalsView) || "table";

  // --- Data ---
  const [editions, setEditions] = useState<EditionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFilmTitle, setSelectedFilmTitle] = useState<string | null>(null);

  // --- Bulk selection state (client-only, persists across pages/filters) ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleAll = useCallback(
    (ids: string[], selectAll: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selectAll) ids.forEach((id) => next.add(id));
        else ids.forEach((id) => next.delete(id));
        return next;
      });
    },
    []
  );
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // --- URL update helper ---
  const updateUrl = useCallback(
    (updates: Record<string, string | boolean | null | undefined>, resetPage = false) => {
      const next = new URLSearchParams(searchParams.toString());
      if (resetPage) next.delete("page");
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === "" || v === false) {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      }
      const qs = next.toString();
      router.replace(qs ? `/festivals?${qs}` : "/festivals", { scroll: false });
    },
    [router, searchParams]
  );

  // --- Fetch ---
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        if (filters.search) qs.set("search", filters.search);
        if (filters.year) qs.set("year", filters.year);
        if (filters.classification) qs.set("classification", filters.classification);
        if (filters.type) qs.set("type", filters.type);
        if (filters.country) qs.set("country", filters.country);
        if (filters.qualifying) qs.set("qualifying", filters.qualifying);
        if (filters.hasDeadline) qs.set("hasDeadline", "true");
        if (filters.feeMax) qs.set("feeMax", filters.feeMax);
        if (filters.urgency) qs.set("urgency", filters.urgency);
        if (filters.planStatus) qs.set("planStatus", filters.planStatus);
        if (filters.filmId) qs.set("filmId", filters.filmId);
        if (filters.onlyCompatible) qs.set("onlyCompatible", "true");
        qs.set("sort", sort.key);
        qs.set("direction", sort.direction);
        qs.set("limit", String(pageSize));
        qs.set("offset", String((page - 1) * pageSize));

        const res = await fetch(`/api/festival-editions?${qs.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setEditions(data.editions || []);
        setTotal(data.total || 0);
        setSelectedFilmTitle(data.film?.titleOriginal || null);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message || "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // --- Callbacks ---
  const onFiltersChange = (next: FestivalsFilters) => {
    updateUrl(
      {
        search: next.search,
        year: next.year,
        classification: next.classification,
        type: next.type,
        country: next.country,
        qualifying: next.qualifying,
        hasDeadline: next.hasDeadline,
        feeMax: next.feeMax,
        urgency: next.urgency,
        planStatus: next.planStatus,
        filmId: next.filmId,
        onlyCompatible: next.onlyCompatible,
      },
      true
    );
  };

  const onFilmChange = (newFilmId: string | null) => {
    // Quando si seleziona un film, cambia il sort default a "compatibility desc"
    // Quando si deseleziona, torna a "deadline asc"
    if (newFilmId) {
      updateUrl(
        {
          filmId: newFilmId,
          sort: "compatibility",
          direction: "desc",
        },
        true
      );
    } else {
      updateUrl(
        {
          filmId: null,
          onlyCompatible: null,
          sort: "deadline",
          direction: "asc",
        },
        true
      );
    }
  };

  const onSortChange = (s: SortState) => {
    updateUrl({ sort: s.key, direction: s.direction }, true);
  };

  const onViewChange = (v: FestivalsView) => {
    try {
      localStorage.setItem("festivals:view", v);
    } catch {
      /* ignore */
    }
    updateUrl({ view: v });
  };

  const onPageChange = (p: number) => {
    updateUrl({ page: p === 1 ? null : String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const subtitle = loading
    ? "Caricamento…"
    : selectedFilmTitle
      ? `Festival per "${selectedFilmTitle}" · ${total} ${filters.onlyCompatible ? "compatibili" : "edizioni valutate"} · ordinate per ${sort.key} ${sort.direction === "asc" ? "↑" : "↓"}`
      : `${total} edizioni ${filters.year ? `del ${filters.year}` : "attive"} · ordinate per ${sort.key} ${sort.direction === "asc" ? "↑" : "↓"}`;

  return (
    <div className="page">
      <PageHeader
        title="Festival"
        subtitle={subtitle}
        action={{ label: "Nuovo Festival", href: "/festivals/new" }}
      />

      <div style={{ padding: "16px 24px" }}>
        <KpiCards />
      </div>

      <FiltersBar
        filters={filters}
        onChange={onFiltersChange}
        total={total}
        filteredCount={editions.length}
        rightSlot={
          <div className="flex items-center gap-2 flex-wrap">
            <FilmSelector value={filters.filmId} onChange={onFilmChange} />
            <ViewToggle view={view} onChange={onViewChange} />
          </div>
        }
      />

      <div style={{ padding: "16px 24px" }}>
        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: "var(--r-lg)",
              background: "var(--accent-bg)",
              color: "var(--accent)",
              fontSize: 12.5,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {loading && editions.length === 0 ? (
          <PageSkeleton />
        ) : editions.length === 0 ? (
          <EmptyState onReset={() => onFiltersChange(EMPTY_FILTERS)} />
        ) : view === "table" ? (
          <FestivalsTable
            editions={editions}
            sort={sort}
            onSortChange={onSortChange}
            selectedIds={selectedIds}
            onToggleId={toggleId}
            onToggleAll={toggleAll}
          />
        ) : (
          <FestivalsCards
            editions={editions}
            selectedIds={selectedIds}
            onToggleId={toggleId}
          />
        )}

        <BulkActionsBar
          selectedIds={selectedIds}
          allEditions={editions}
          onClear={clearSelection}
          initialFilmId={filters.filmId}
        />

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between gap-3 pt-2 mt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <span>Per pagina</span>
            <select
              value={pageSize}
              onChange={(e) =>
                updateUrl({ pageSize: e.target.value, page: null }, false)
              }
              className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
        </div>
      )}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
      <p className="text-[var(--muted-foreground)]">
        Nessuna edizione trovata con i filtri attuali.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 px-3 py-1.5 border border-[var(--border)] rounded text-sm hover:bg-[var(--secondary)]"
      >
        Pulisci filtri
      </button>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-2 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-40 hover:bg-[var(--secondary)]"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-[var(--muted-foreground)]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`px-3 py-1 border rounded text-sm ${
              p === page
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "border-[var(--border)] hover:bg-[var(--secondary)]"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-2 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-40 hover:bg-[var(--secondary)]"
      >
        ›
      </button>
    </div>
  );
}
