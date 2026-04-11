import { StatusBadge } from "@/components/status-badge";
import { formatDate, isUrgent, formatCurrency } from "@/lib/utils";

interface FestivalMatchCardProps {
  festival: {
    id: string;
    name: string;
    city: string;
    country: string;
    category: string;
    deadlineGeneral?: string | null;
    feesAmount?: number | null;
    specialization?: string | null;
  };
  score: number;
  reasoning: string;
  warnings?: string[];
  selected?: boolean;
  onSelect?: () => void;
  status?: string;
  compact?: boolean;
}

export function FestivalMatchCard({
  festival,
  score,
  reasoning,
  warnings = [],
  selected,
  onSelect,
  status,
  compact,
}: FestivalMatchCardProps) {
  const scoreColor =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border transition-all ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]"
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{festival.name}</h4>
            <StatusBadge value={festival.category} />
            {festival.specialization && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {festival.specialization}
              </span>
            )}
            {status && <StatusBadge value={status} />}
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {festival.city}, {festival.country}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-lg font-bold">{Math.round(score)}</div>
            <div className="text-xs text-[var(--muted-foreground)]">score</div>
          </div>
          <div className={`w-2 h-8 rounded-full ${scoreColor}`} />
        </div>
      </div>

      {!compact && (
        <>
          <p className="text-sm mt-2">{reasoning}</p>

          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
            {festival.deadlineGeneral && (
              <span className={isUrgent(festival.deadlineGeneral) ? "text-[var(--accent)] font-medium" : ""}>
                Deadline: {formatDate(festival.deadlineGeneral)}
              </span>
            )}
            {festival.feesAmount !== undefined && festival.feesAmount !== null && (
              <span>Fee: {formatCurrency(festival.feesAmount)}</span>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                  <span>&#9888;</span> {w}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
