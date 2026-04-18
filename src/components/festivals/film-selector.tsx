"use client";

import { useEffect, useState } from "react";

interface FilmOption {
  id: string;
  titleOriginal: string;
  duration: number;
  genre: string | null;
  status: string;
}

interface FilmSelectorProps {
  value: string; // filmId corrente
  onChange: (filmId: string | null) => void;
}

export function FilmSelector({ value, onChange }: FilmSelectorProps) {
  const [films, setFilms] = useState<FilmOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/films")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setFilms(
            data.map((f) => ({
              id: f.id,
              titleOriginal: f.titleOriginal,
              duration: f.duration,
              genre: f.genre,
              status: f.status,
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = films.find((f) => f.id === value);

  return (
    <div className="inline-flex items-center gap-1 border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-hidden">
      <span className="pl-2.5 py-1.5 text-sm" aria-hidden="true">
        🎬
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={loading || films.length === 0}
        className="pr-2 py-1.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-w-[160px] max-w-[240px]"
        aria-label="Seleziona un film per vedere la compatibilità"
      >
        <option value="">
          {loading ? "Caricamento…" : "Scegli un film…"}
        </option>
        {films.map((f) => (
          <option key={f.id} value={f.id}>
            {f.titleOriginal} ({Math.round(f.duration)}′)
          </option>
        ))}
      </select>
      {selected && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] border-l border-[var(--border)]"
          title="Rimuovi film"
          aria-label="Rimuovi selezione film"
        >
          ×
        </button>
      )}
    </div>
  );
}
