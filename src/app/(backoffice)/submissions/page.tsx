"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SUBMISSION_STATUS_OPTIONS, SUBMISSION_RESULT_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface Submission {
  id: string;
  status: string;
  platform: string | null;
  submittedAt: string | null;
  feesPaid: number | null;
  result: string | null;
  film: { title: string };
  festival: { name: string };
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => { setSubmissions(data); setLoading(false); });
  }, []);

  const resultLabel = (value: string | null): string => {
    if (!value) return "—";
    const opt = SUBMISSION_RESULT_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : value;
  };

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.film.title.toLowerCase().includes(q) ||
      s.festival.name.toLowerCase().includes(q);
    const matchesFilter = !filter || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Iscrizioni"
        subtitle={`${filtered.length} iscrizioni totali`}
        action={{ label: "Nuova Iscrizione", href: "/submissions/new" }}
      />

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Cerca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Tutti</option>
          {SUBMISSION_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">Caricamento...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">Nessuna iscrizione. Crea la prima iscrizione.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Film</th>
                <th className="text-left px-4 py-3 font-medium">Festival</th>
                <th className="text-left px-4 py-3 font-medium">Stato</th>
                <th className="text-left px-4 py-3 font-medium">Risultato</th>
                <th className="text-left px-4 py-3 font-medium">Piattaforma</th>
                <th className="text-left px-4 py-3 font-medium">Data Invio</th>
                <th className="text-left px-4 py-3 font-medium">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--secondary)] transition-colors">
                  <td className="px-4 py-3 font-medium">{s.film.title}</td>
                  <td className="px-4 py-3">
                    <Link href={`/submissions/${s.id}`} className="hover:underline">{s.festival.name}</Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={s.status} /></td>
                  <td className="px-4 py-3">
                    {s.result ? <StatusBadge value={s.result} /> : "—"}
                  </td>
                  <td className="px-4 py-3">{s.platform || "—"}</td>
                  <td className="px-4 py-3">{formatDate(s.submittedAt)}</td>
                  <td className="px-4 py-3">{s.feesPaid ? `€${s.feesPaid}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
