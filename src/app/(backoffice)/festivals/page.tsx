"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CompletenessBar } from "@/components/completeness-bar";
import { computeEditionStatus, formatDate } from "@/lib/utils";

interface LatestEdition {
  id: string;
  year: number;
  deadlineEarly: string | null;
  deadlineGeneral: string | null;
  deadlineLate: string | null;
  deadlineFinal: string | null;
  notificationDate: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
}

interface FestivalMaster {
  id: string;
  name: string;
  city: string;
  country: string;
  classification: string | null;
  type: string | null;
  academyQualifying: boolean;
  punxRating: number | null;
  completenessScore?: number;
  _count: { editions: number };
  editions: LatestEdition[];
}

const CLASSIFICATION_OPTIONS = [
  { value: "international", label: "International" },
  { value: "national", label: "National" },
  { value: "regional", label: "Regional" },
  { value: "local", label: "Local" },
];

const TYPE_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "mixed", label: "Mixed" },
  { value: "documentary", label: "Documentary" },
  { value: "feature", label: "Feature" },
  { value: "animation", label: "Animation" },
];

const COUNTRY_OPTIONS = [
  "Italia",
  "USA",
  "Spagna",
  "Germania",
  "Francia",
  "Regno Unito",
  "Australia",
  "India",
  "Belgio",
  "Polonia",
  "Portogallo",
];

const PAGE_SIZE = 50;

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<FestivalMaster[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");

  const buildUrl = useCallback(
    (currentOffset: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(currentOffset));
      if (search) params.set("search", search);
      if (classification) params.set("classification", classification);
      if (type) params.set("type", type);
      if (country) params.set("country", country);
      if (verificationFilter) params.set("verificationStatus", verificationFilter);
      return `/api/festival-masters?${params.toString()}`;
    },
    [search, classification, type, country, verificationFilter]
  );

  // Fetch first page whenever filters change
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    fetch(buildUrl(0))
      .then((res) => res.json())
      .then((data) => {
        setFestivals(data.festivals ?? data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setFestivals([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [buildUrl]);

  // Load more
  const loadMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setLoadingMore(true);
    fetch(buildUrl(nextOffset))
      .then((res) => res.json())
      .then((data) => {
        const items: FestivalMaster[] = data.festivals ?? data.data ?? [];
        setFestivals((prev) => [...prev, ...items]);
        setOffset(nextOffset);
      })
      .finally(() => setLoadingMore(false));
  };

  const hasMore = festivals.length < total;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Festival"
          subtitle="Caricamento..."
          action={{ label: "Nuovo Festival", href: "/festivals/new" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Festival"
        subtitle={`${festivals.length} di ${total} festival`}
        action={{ label: "Nuovo Festival", href: "/festivals/new" }}
      />

      <div className="flex justify-end">
        <Link href="/festivals/analytics" className="text-sm text-[var(--primary)] hover:underline">
          Analytics Festival →
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Cerca nome, citta, paese..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <select
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Classificazione: Tutti</option>
          {CLASSIFICATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Tipo: Tutti</option>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Paese: Tutti</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Verifica: Tutti</option>
          <option value="unverified">Non verificato</option>
          <option value="verified">Verificato</option>
          <option value="needs_review">Da rivedere</option>
        </select>
      </div>

      {/* Table or empty */}
      {festivals.length === 0 ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">
            {total === 0 && !search && !classification && !type && !country
              ? "Nessun festival. Aggiungi il primo festival."
              : "Nessun festival corrisponde ai filtri."}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Citta / Paese
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Classificazione
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Academy</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Deadline</th>
                  <th className="text-left px-4 py-3 font-medium">Rating</th>
                  <th className="text-left px-4 py-3 font-medium">Completezza</th>
                  <th className="text-left px-4 py-3 font-medium">Edizioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {festivals.map((f) => {
                  const latestEdition = f.editions?.[0] ?? null;
                  const editionStatus = latestEdition
                    ? computeEditionStatus(latestEdition)
                    : null;
                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-[var(--secondary)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/festivals/${f.id}`}
                          className="font-medium hover:underline"
                        >
                          {f.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {f.city}, {f.country}
                      </td>
                      <td className="px-4 py-3">
                        {f.type ? <StatusBadge value={f.type} /> : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {f.classification ? (
                          <StatusBadge value={f.classification} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {f.academyQualifying ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Academy
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editionStatus ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${editionStatus.color}`}
                            >
                              {editionStatus.label}
                            </span>
                            {editionStatus.countdown && (
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {editionStatus.countdown}
                              </p>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editionStatus?.nextDeadline ? (
                          <span
                            className={`text-sm ${
                              (() => {
                                const d = new Date(editionStatus.nextDeadline);
                                const days = Math.ceil(
                                  (d.getTime() - Date.now()) /
                                    (24 * 60 * 60 * 1000)
                                );
                                if (days < 0) return "text-[var(--muted-foreground)] line-through";
                                if (days <= 3) return "text-red-600 font-semibold";
                                if (days <= 7) return "text-orange-600 font-medium";
                                return "";
                              })()
                            }`}
                          >
                            {formatDate(editionStatus.nextDeadline)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {f.punxRating != null ? (
                          <span className="text-amber-500 tracking-wide whitespace-nowrap" title={`${f.punxRating}/5`}>
                            {"★".repeat(f.punxRating)}
                            {"☆".repeat(5 - f.punxRating)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <CompletenessBar score={f.completenessScore || 0} size="sm" showLabel />
                      </td>
                      <td className="px-4 py-3">{f._count.editions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Caricamento..." : "Carica altri"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
