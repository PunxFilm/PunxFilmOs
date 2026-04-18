"use client";

export interface SheetInfo {
  name: string;
  rowCount: number;
  headers: string[];
}

export function SheetPicker({
  sheets,
  selected,
  onToggle,
}: {
  sheets: SheetInfo[];
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
}) {
  if (sheets.length === 0) return null;
  return (
    <div
      className="rounded-md border p-3 space-y-2"
      style={{
        borderColor: "var(--border)",
        background: "var(--card)",
      }}
    >
      <div className="text-xs font-semibold" style={{ color: "var(--fg-2)" }}>
        Fogli disponibili ({sheets.length})
      </div>
      <div className="space-y-1.5">
        {sheets.map((s) => {
          const isSelected = selected.includes(s.name);
          return (
            <label
              key={s.name}
              className="flex items-start gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onToggle(s.name, e.target.checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                  {s.rowCount} righe
                  {s.headers.length > 0 &&
                    ` — ${s.headers.slice(0, 5).join(", ")}${s.headers.length > 5 ? "…" : ""}`}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
