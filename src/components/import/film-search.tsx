"use client";

import { useEffect, useState } from "react";

interface FilmResult {
  id: string;
  titleOriginal: string;
  director: string;
  year: number;
}

export function FilmSearch({
  onSelect,
  selectedId,
}: {
  onSelect: (film: FilmResult) => void;
  selectedId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FilmResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/films");
        if (!res.ok) return;
        const data = (await res.json()) as FilmResult[];
        const q = query.toLowerCase();
        const filtered = data
          .filter(
            (f) =>
              f.titleOriginal?.toLowerCase().includes(q) ||
              f.director?.toLowerCase().includes(q)
          )
          .slice(0, 10);
        setResults(filtered);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Cerca per titolo o regista..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 rounded-md border text-sm"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--fg)",
        }}
      />
      {loading && (
        <p className="text-xs" style={{ color: "var(--fg-3)" }}>
          Cerco...
        </p>
      )}
      {results.length > 0 && (
        <div
          className="rounded-md border overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          {results.map((f) => {
            const isSelected = f.id === selectedId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelect(f)}
                className="w-full text-left px-3 py-2 text-sm flex items-center justify-between"
                style={{
                  background: isSelected
                    ? "var(--accent-bg)"
                    : "var(--card)",
                  borderTop: "1px solid var(--border)",
                  color: isSelected ? "var(--accent)" : "var(--fg)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{f.titleOriginal}</div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--fg-3)" }}
                  >
                    {f.director} • {f.year}
                  </div>
                </div>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-xs" style={{ color: "var(--fg-3)" }}>
          Nessun film trovato.
        </p>
      )}
    </div>
  );
}
