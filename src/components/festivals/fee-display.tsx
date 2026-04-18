interface FeeDisplayProps {
  amount: number | null | undefined;
  currency?: string | null;
  lateFee?: number | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CAD: "CA$",
  AUD: "AU$",
  CHF: "CHF",
  SEK: "kr",
  BRL: "R$",
  TRY: "₺",
  JPY: "¥",
};

function formatAmount(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  const rounded = Math.round(amount);
  return `${rounded} ${sym}`;
}

export function FeeDisplay({ amount, currency = "EUR", lateFee }: FeeDisplayProps) {
  if (amount == null || amount === 0 || amount < 1) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
        FREE
      </span>
    );
  }

  const main = formatAmount(amount, currency || "EUR");
  const late = lateFee && lateFee > amount ? formatAmount(lateFee, currency || "EUR") : null;

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-sm font-medium whitespace-nowrap">{main}</span>
      {late && (
        <span className="text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
          late: {late}
        </span>
      )}
    </div>
  );
}
