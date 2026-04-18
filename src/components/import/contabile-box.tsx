"use client";

function formatEur(v: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);
}

export function ContabileBox({
  totalListPrice,
  totalFeesPaid,
  discount,
  maxDiscount,
  onDiscountChange,
}: {
  totalListPrice: number;
  totalFeesPaid: number;
  discount: number;
  maxDiscount: number; // = margine = totalListPrice - totalFeesPaid
  onDiscountChange: (v: number) => void;
}) {
  const margin = totalListPrice - totalFeesPaid;
  const charged = totalListPrice - discount;
  const effectiveMargin = margin - discount;

  return (
    <div
      className="rounded-lg border p-4 space-y-3"
      style={{
        borderColor: "var(--border)",
        background: "var(--card)",
      }}
    >
      <div
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--fg-3)" }}
      >
        Riepilogo contabile
      </div>

      <div className="space-y-1.5 text-sm">
        <Row
          label="Prezzo di listino totale"
          value={formatEur(totalListPrice)}
        />
        <Row
          label="Pagato ai festival"
          value={`- ${formatEur(totalFeesPaid)}`}
          muted
        />
        <div
          className="h-px"
          style={{ background: "var(--border)", margin: "4px 0" }}
        />
        <Row
          label="Margine PunxFilm"
          value={formatEur(margin)}
          bold
          color={margin >= 0 ? "var(--ok)" : "var(--accent)"}
        />
      </div>

      <div className="pt-1 space-y-2">
        <label
          className="text-xs font-medium block"
          style={{ color: "var(--fg-2)" }}
        >
          Sconto al cliente:{" "}
          <span className="mono" style={{ color: "var(--fg)" }}>
            {formatEur(discount)}
          </span>{" "}
          <span style={{ color: "var(--fg-3)" }}>
            / max {formatEur(maxDiscount)}
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={Math.max(0, Math.round(maxDiscount * 2) / 2)}
          step={0.5}
          value={Math.min(discount, maxDiscount)}
          onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
          className="w-full"
          disabled={maxDiscount <= 0}
        />
      </div>

      <div
        className="pt-2 border-t space-y-1.5 text-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <Row label="Addebitato al cliente" value={formatEur(charged)} bold />
        <Row
          label="Margine effettivo"
          value={formatEur(effectiveMargin)}
          color={effectiveMargin >= 0 ? "var(--ok)" : "var(--accent)"}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-baseline">
      <span
        style={{
          color: muted ? "var(--fg-3)" : "var(--fg-2)",
        }}
      >
        {label}
      </span>
      <span
        className="mono"
        style={{
          fontWeight: bold ? 600 : 500,
          color: color ?? (muted ? "var(--fg-3)" : "var(--fg)"),
        }}
      >
        {value}
      </span>
    </div>
  );
}
