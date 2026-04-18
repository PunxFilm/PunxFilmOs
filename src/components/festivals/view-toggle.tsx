"use client";

export type FestivalsView = "table" | "cards";

interface ViewToggleProps {
  view: FestivalsView;
  onChange: (view: FestivalsView) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Cambia vista"
      className="inline-flex border border-[var(--border)] rounded-lg overflow-hidden text-sm"
    >
      <button
        type="button"
        onClick={() => onChange("table")}
        aria-pressed={view === "table"}
        className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
          view === "table"
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--card)] hover:bg-[var(--secondary)]"
        }`}
      >
        <span aria-hidden="true">📋</span>
        <span className="hidden sm:inline">Tabella</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        aria-pressed={view === "cards"}
        className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-[var(--border)] transition-colors ${
          view === "cards"
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--card)] hover:bg-[var(--secondary)]"
        }`}
      >
        <span aria-hidden="true">▤</span>
        <span className="hidden sm:inline">Card</span>
      </button>
    </div>
  );
}
