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

  const queueTone = (status: string) => {
    if (status === "approved") return "badge ok";
    if (status === "subscribed") return "badge purple";
    if (status === "rejected") return "badge";
    return "badge";
  };

  return (
    <Link href={`/strategies/${plan.id}`}>
      <div className="card" style={{ padding: 16, cursor: "pointer" }}>
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <h3 className="serif" style={{ fontSize: 16, margin: 0 }}>
              {plan.film.titleOriginal}
            </h3>
            <p className="tiny" style={{ marginTop: 4 }}>
              {plan.film.director} &middot; {plan.film.genre} &middot; {formatDuration(plan.film.duration)}
            </p>
          </div>
          <div className="row gap-2">
            <StatusBadge value={plan.premiereLevel} />
            <StatusBadge value={plan.status} />
          </div>
        </div>

        {premiere && (
          <div
            className="row gap-2 mt-3"
            style={{
              padding: "8px 10px",
              borderRadius: "var(--r)",
              background: "var(--warn-bg)",
              border: "1px solid color-mix(in oklch, var(--warn) 35%, transparent)",
              flexWrap: "wrap",
            }}
          >
            <StatusBadge value="premiere" />
            <span style={{ fontWeight: 500, fontSize: 12.5 }}>{premiere.festivalMaster.name}</span>
            <StatusBadge value={premiere.status} />
          </div>
        )}

        {queue.length > 0 && (
          <div className="mt-3">
            <p className="tiny" style={{ marginBottom: 6 }}>
              Coda: {approvedCount} approvati / {queue.length} totali
              {subscribedCount > 0 && ` \u00B7 ${subscribedCount} iscritti`}
            </p>
            <div className="row wrap gap-2">
              {queue.slice(0, 5).map((e) => (
                <span
                  key={e.id}
                  className={`${queueTone(e.status)} nb`}
                  style={e.status === "rejected" ? { textDecoration: "line-through", opacity: 0.7 } : undefined}
                >
                  {e.festivalMaster.name}
                </span>
              ))}
              {queue.length > 5 && (
                <span className="tiny">+{queue.length - 5} altri</span>
              )}
            </div>
          </div>
        )}

        {totalFees > 0 && (
          <p className="tiny mt-2">Budget stimato: {formatCurrency(totalFees)}</p>
        )}
      </div>
    </Link>
  );
}
