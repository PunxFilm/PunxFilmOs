"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { FILM_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate, formatDuration } from "@/lib/utils";

interface Film {
  id: string;
  titleOriginal: string;
  director: string;
  year: number;
  genre: string;
  duration: number;
  country: string;
  status: string;
  createdAt: string;
  _count: { submissions: number };
}

export default function FilmsPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/films")
      .then((res) => res.json())
      .then((data) => setFilms(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = films.filter((f) => {
    const matchesSearch =
      search === "" ||
      f.titleOriginal.toLowerCase().includes(search.toLowerCase()) ||
      f.director.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Film"
          subtitle="Caricamento..."
          action={{ label: "Nuovo Film", href: "/films/new" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Film"
        subtitle={`${filtered.length} di ${films.length} film in catalogo`}
        action={{ label: "Nuovo Film", href: "/films/new" }}
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Tutti</option>
          {FILM_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">
            {films.length === 0
              ? "Nessun film. Aggiungi il primo film per iniziare."
              : "Nessun film corrisponde ai filtri."}
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Titolo</th>
                <th className="text-left px-4 py-3 font-medium">Regista</th>
                <th className="text-left px-4 py-3 font-medium">Anno</th>
                <th className="text-left px-4 py-3 font-medium">Genere</th>
                <th className="text-left px-4 py-3 font-medium">Durata</th>
                <th className="text-left px-4 py-3 font-medium">Iscrizioni</th>
                <th className="text-left px-4 py-3 font-medium">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((film) => (
                <tr
                  key={film.id}
                  className="hover:bg-[var(--secondary)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/films/${film.id}`}
                      className="font-medium hover:underline"
                    >
                      {film.titleOriginal}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{film.director}</td>
                  <td className="px-4 py-3">{film.year}</td>
                  <td className="px-4 py-3">{film.genre}</td>
                  <td className="px-4 py-3">
                    {formatDuration(film.duration)}
                  </td>
                  <td className="px-4 py-3">{film._count.submissions}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={film.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
