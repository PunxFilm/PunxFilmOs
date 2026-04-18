/**
 * Shared UI atoms ported from the design handoff.
 * DeadlineCell, MatchBar, Stars, QualifyingDots — pure display.
 */

interface DeadlineCellProps {
  date: Date | string | null | undefined;
  type?: string | null;
  today?: Date;
}

export function daysBetween(
  date: Date | string | null | undefined,
  today = new Date()
): number | null {
  if (!date) return null;
  const d = new Date(date);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

export function fmtDate(date: Date | string | null | undefined, opts: { year?: boolean } = {}) {
  if (!date) return "—";
  const d = new Date(date);
  const o: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    ...(opts.year !== false ? { year: "numeric" } : {}),
  };
  return d.toLocaleDateString("it-IT", o);
}

export function fmtShort(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

export function fmtMoney(n: number | null | undefined, c = "EUR") {
  if (n == null) return "—";
  const sym: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF " };
  return (sym[c] || c + " ") + new Intl.NumberFormat("it-IT").format(n);
}

export function fmtNum(n: number) {
  return new Intl.NumberFormat("it-IT").format(n);
}

export function DeadlineCell({ date, type, today }: DeadlineCellProps) {
  const days = daysBetween(date, today);
  const cls = days == null ? "" : days <= 3 ? "crit" : days <= 14 ? "soon" : "ok";
  const txt =
    days == null
      ? "—"
      : days === 0
        ? "oggi"
        : days === 1
          ? "domani"
          : days < 0
            ? `${Math.abs(days)}g fa`
            : `T−${days}g`;
  return (
    <span className="row" style={{ gap: 6 }}>
      <span className={`d-dot ${cls}`} />
      <span className="u-num" style={{ minWidth: 62 }}>
        {txt}
      </span>
      <span
        className="tiny"
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: 10,
        }}
      >
        {type || "reg"}
      </span>
    </span>
  );
}

export function MatchBar({ value }: { value: number }) {
  const cls = value >= 85 ? "ok" : value >= 70 ? "" : value >= 50 ? "warn" : "dim";
  return (
    <span className="match-bar">
      <span className="mb-bar">
        <span
          className={`mb-fill ${cls}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
      <span className="mb-val">{Math.round(value)}</span>
    </span>
  );
}

export function Stars({ n, max = 5 }: { n: number; max?: number }) {
  const safeN = Math.max(0, Math.min(max, Math.round(n)));
  return (
    <span className="stars" title={`${safeN}/${max}`}>
      {"★".repeat(safeN)}
      <span className="dim">{"★".repeat(max - safeN)}</span>
    </span>
  );
}

interface QualifyingFlags {
  academy?: boolean;
  bafta?: boolean;
  efa?: boolean;
  goya?: boolean;
}

export function QualifyingDots({ fes }: { fes: QualifyingFlags }) {
  const set = [
    { key: "academy", label: "Oscar", on: fes.academy },
    { key: "bafta", label: "BAFTA", on: fes.bafta },
    { key: "efa", label: "EFA", on: fes.efa },
    { key: "goya", label: "Goya", on: fes.goya },
  ];
  return (
    <span className="row" style={{ gap: 4 }}>
      {set.map((q) => (
        <span
          key={q.key}
          title={q.label}
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "2px 4px",
            borderRadius: 3,
            color: q.on ? "var(--warn)" : "var(--fg-4)",
            background: q.on ? "var(--warn-bg)" : "transparent",
            border: q.on
              ? "1px solid color-mix(in oklch, var(--warn) 30%, transparent)"
              : "1px solid var(--border)",
            fontFamily: "var(--mono)",
          }}
        >
          {q.label.slice(0, 3).toUpperCase()}
        </span>
      ))}
    </span>
  );
}
