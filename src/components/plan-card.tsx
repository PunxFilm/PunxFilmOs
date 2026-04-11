import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface PlanCardProps {
  plan: {
    id: string;
    premiereLevel: string;
    status: string;
    film: { titleOriginal: string; director: string; genre: string; duration: number };
    entries: {
      id: string;
      role: string;
      status: string;
      position: number;
      estimatedFee: number | null;
      festivalMaster: { name: string };
    }[];
  };
}

export function PlanCard({ plan }: PlanCardProps) {
  const premiere = plan.entries.find((e) => e.role === "premiere");
  const queue = plan.entries.filter((e) => e.role === "queue").sort((a, b) => a.position - b.position);
  const approvedCount = queue.filter((e) => e.status === "approved" || e.status === "subscribed").length;
  const subscribedCount = plan.entries.filter((e) => e.status === "subscribed").length;

  const totalFees = plan.entries
    .filter((e) => e.status === "approved" || e.status === "subscribed")
    .reduce((sum, e) => sum + (e.estimatedFee || 0), 0);

  return (
    <Link href={`/strategies/${plan.id}`}>
      <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)] transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{plan.film.titleOriginal}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {plan.film.director} &middot; {plan.film.genre} &middot; {formatDuration(plan.film.duration)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge value={plan.premiereLevel} />
            <StatusBadge value={plan.status} />
          </div>
        </div>

        {premiere && (
          <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <StatusBadge value="premiere" />
              <span className="font-medium text-sm">{premiere.festivalMaster.name}</span>
              <StatusBadge value={premiere.status} />
            </div>
          </div>
        )}

        {queue.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">
              Coda: {approvedCount} approvati / {queue.length} totali
              {subscribedCount > 0 && ` \u00B7 ${subscribedCount} iscritti`}
            </p>
            <div className="flex flex-wrap gap-1">
              {queue.slice(0, 5).map((e) => (
                <span
                  key={e.id}
                  className={`px-2 py-0.5 rounded text-xs ${
                    e.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : e.status === "subscribed"
                        ? "bg-purple-100 text-purple-800"
                        : e.status === "rejected"
                          ? "bg-red-100 text-red-800 line-through"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {e.festivalMaster.name}
                </span>
              ))}
              {queue.length > 5 && (
                <span className="px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                  +{queue.length - 5} altri
                </span>
              )}
            </div>
          </div>
        )}

        {totalFees > 0 && (
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            Budget stimato: {formatCurrency(totalFees)}
          </p>
        )}
      </div>
    </Link>
  );
}
