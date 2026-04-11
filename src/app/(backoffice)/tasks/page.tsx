"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { TASK_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  film: { title: string } | null;
  submission: { festival: { name: string } } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("not_done");

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false); });
  }, []);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.title.toLowerCase().includes(q);
    let matchesFilter: boolean;
    if (filter === "not_done") {
      matchesFilter = t.status !== "done";
    } else if (filter === "") {
      matchesFilter = true;
    } else {
      matchesFilter = t.status === filter;
    }
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task"
        subtitle={`${filtered.length} task${filter === "not_done" ? " aperti" : ""} su ${tasks.length} totali`}
        action={{ label: "Nuovo Task", href: "/tasks/new" }}
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
          <option value="not_done">Non completati</option>
          <option value="">Tutti</option>
          {TASK_STATUS_OPTIONS.map((o) => (
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
          <p className="text-[var(--muted-foreground)]">Nessun task. Crea il primo task.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Titolo</th>
                <th className="text-left px-4 py-3 font-medium">Stato</th>
                <th className="text-left px-4 py-3 font-medium">Priorità</th>
                <th className="text-left px-4 py-3 font-medium">Scadenza</th>
                <th className="text-left px-4 py-3 font-medium">Film</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((t) => (
                <tr key={t.id} className={`hover:bg-[var(--secondary)] transition-colors ${t.status === "done" ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <Link href={`/tasks/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={t.status} /></td>
                  <td className="px-4 py-3"><StatusBadge value={t.priority} /></td>
                  <td className="px-4 py-3">{formatDate(t.dueDate)}</td>
                  <td className="px-4 py-3">{t.film?.title || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
