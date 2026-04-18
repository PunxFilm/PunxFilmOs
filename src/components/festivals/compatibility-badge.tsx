"use client";

import { useState } from "react";
import type { FilmContext } from "@/lib/film-festival-match";

interface CompatibilityBadgeProps {
  context: FilmContext;
  size?: "sm" | "md" | "lg";
}

const STYLES = {
  best: {
    icon: "⭐",
    label: "Top",
    className: "bg-emerald-600 text-white border-emerald-700",
    rowClass: "bg-emerald-50/50",
  },
  good: {
    icon: "✓",
    label: "Match",
    className: "bg-emerald-100 text-emerald-900 border-emerald-300",
    rowClass: "",
  },
  ok: {
    icon: "─",
    label: "OK",
    className: "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]",
    rowClass: "",
  },
  warning: {
    icon: "⚠️",
    label: "Attenzione",
    className: "bg-amber-100 text-amber-900 border-amber-300",
    rowClass: "bg-amber-50/30",
  },
  incompatible: {
    icon: "⛔",
    label: "No",
    className: "bg-red-100 text-red-900 border-red-300",
    rowClass: "bg-red-50/50",
  },
} as const;

export function CompatibilityBadge({ context, size = "sm" }: CompatibilityBadgeProps) {
  const [open, setOpen] = useState(false);
  const style = STYLES[context.compatibilityLevel];

  const score = context.compatibilityScore;
  const sizeClass =
    size === "lg"
      ? "px-3 py-1.5 text-sm gap-2"
      : size === "md"
        ? "px-2 py-1 text-xs gap-1.5"
        : "px-2 py-0.5 text-[11px] gap-1";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`inline-flex items-center border rounded font-semibold whitespace-nowrap ${style.className} ${sizeClass}`}
        aria-label={`Compatibilità ${style.label}, ${score}/100`}
      >
        <span aria-hidden="true">{style.icon}</span>
        <span>{score}</span>
      </button>

      {open && context.warnings.length > 0 && (
        <div
          role="tooltip"
          className="absolute z-20 left-0 top-full mt-1 w-72 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg p-3 space-y-1.5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {style.label} · {score}/100
          </p>
          <ul className="space-y-1">
            {context.warnings.map((w, i) => (
              <li
                key={i}
                className={`text-xs leading-relaxed ${
                  w.severity === "block"
                    ? "text-red-800 font-medium"
                    : w.severity === "warn"
                      ? "text-amber-800"
                      : "text-[var(--muted-foreground)]"
                }`}
              >
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function compatibilityRowClass(context: FilmContext | null | undefined): string {
  if (!context) return "";
  return STYLES[context.compatibilityLevel].rowClass;
}
