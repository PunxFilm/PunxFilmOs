"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { FINANCE_TYPE_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface FinanceEntry {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  filmTitle: string | null;
  festivalName: string | null;
}

export default function FinancePage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/finance")
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }, []);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.filmTitle && e.filmTitle.toLowerCase().includes(q)) ||
      (e.festivalName && e.festivalName.toLowerCase().includes(q));
    const matchesFilter = !filter || e.type === filter;
    return matchesSearch && matchesFilter;
  });

  const totalExpenses = filtered
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);
  const totalIncome = filtered
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanza"
        subtitle={`${filtered.length} movimenti`}
        action={{ label: "Nuovo Movimento", href: "/finance/new" }}
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
          {FINANCE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <p className="text-sm text-[var(--muted-foreground)]">Totale Spese</p>
          <p className="text-2xl font-bold text-red-600">-€{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <p className="text-sm text-[var(--muted-foreground)]">Totale Entrate</p>
          <p className="text-2xl font-bold text-green-600">€{totalIncome.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <p className="text-sm text-[var(--muted-foreground)]">Saldo</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
            €{(totalIncome - totalExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">Caricamento...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">Nessun movimento. Registra il primo.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 font-medium">Importo</th>
                <th className="text-left px-4 py-3 font-medium">Descrizione</th>
                <th className="text-left px-4 py-3 font-medium">Film</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--secondary)] transition-colors">
                  <td className="px-4 py-3">{formatDate(e.date)}</td>
                  <td className="px-4 py-3"><StatusBadge value={e.type} /></td>
                  <td className="px-4 py-3"><StatusBadge value={e.category} /></td>
                  <td className={`px-4 py-3 font-medium ${e.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                    {e.type === "expense" ? "-" : "+"}€{e.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/finance/${e.id}`} className="hover:underline">{e.description || "—"}</Link>
                  </td>
                  <td className="px-4 py-3">{e.filmTitle || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
