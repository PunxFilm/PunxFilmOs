import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { classifyUrgency } from "@/lib/deadline-helpers";

export const dynamic = "force-dynamic";

type UrgencyInfo = {
  label: string;
  color: string;
};

const URGENCY_STYLE: Record<string, UrgencyInfo> = {
  urgent: { label: "Urgente", color: "bg-red-100 text-red-800 border-red-200" },
  soon: { label: "Imminente", color: "bg-amber-100 text-amber-800 border-amber-200" },
  comfortable: {
    label: "In programma",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  far: { label: "Lontano", color: "bg-blue-100 text-blue-800 border-blue-200" },
  past: { label: "Scaduta", color: "bg-[var(--muted)] text-[var(--muted-foreground)]" },
};

export default async function NotificationsPage() {
  const today = new Date();

  // Deadlines ≤ 60 giorni
  const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [upcomingDeadlines, recentResults, submissionsCount] = await Promise.all([
    prisma.festivalEdition.findMany({
      where: {
        activeDeadlineDate: {
          gte: today,
          lte: sixtyDaysFromNow,
        },
      },
      orderBy: { activeDeadlineDate: "asc" },
      take: 30,
      include: {
        festivalMaster: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            classification: true,
            academyQualifying: true,
            baftaQualifying: true,
            efaQualifying: true,
          },
        },
      },
    }),
    prisma.submission.findMany({
      where: {
        result: { not: null },
        updatedAt: { gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        film: { select: { titleOriginal: true } },
        festivalEdition: {
          include: { festivalMaster: { select: { name: true } } },
        },
      },
    }),
    prisma.submission.count({ where: { status: "submitted" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifiche"
        subtitle={`${upcomingDeadlines.length} deadline nei prossimi 60 giorni · ${submissionsCount} submission aperte`}
      />

      {/* DEADLINE IMMINENTI */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          Deadline imminenti
        </h2>

        {upcomingDeadlines.length === 0 ? (
          <div className="p-8 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <p className="text-[var(--muted-foreground)] text-sm">
              Nessuna deadline nei prossimi 60 giorni.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-hidden">
            {upcomingDeadlines.map((e) => {
              const urgency = classifyUrgency(e.daysToDeadline);
              const style = URGENCY_STYLE[urgency];
              const qualifyingBadges: string[] = [];
              if (e.festivalMaster.academyQualifying) qualifyingBadges.push("Oscar");
              if (e.festivalMaster.baftaQualifying) qualifyingBadges.push("BAFTA");
              if (e.festivalMaster.efaQualifying) qualifyingBadges.push("EFA");

              return (
                <li key={e.id} className="p-4 hover:bg-[var(--secondary)] transition-colors">
                  <Link
                    href={`/festivals/${e.festivalMaster.id}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${style.color}`}
                        >
                          {style.label} · {e.daysToDeadline}gg
                        </span>
                        {e.activeDeadlineType && (
                          <span className="text-xs text-[var(--muted-foreground)] uppercase">
                            {e.activeDeadlineType}
                          </span>
                        )}
                        {qualifyingBadges.map((q) => (
                          <span
                            key={q}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                      <p className="font-medium text-sm mt-1 truncate">
                        {e.festivalMaster.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {e.festivalMaster.city}, {e.festivalMaster.country} · Ed. {e.year}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {formatDate(e.activeDeadlineDate!)}
                      </p>
                      {e.feeAmount != null && e.feeAmount > 0 && (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {e.feeAmount} {e.feeCurrency}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* RISULTATI RECENTI */}
      {recentResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
            Risultati recenti (ultimi 30 giorni)
          </h2>
          <ul className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-hidden">
            {recentResults.map((s) => (
              <li key={s.id} className="p-4 hover:bg-[var(--secondary)]">
                <Link
                  href={`/submissions/${s.id}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{s.film.titleOriginal}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {s.festivalEdition.festivalMaster.name} · Ed. {s.festivalEdition.year}
                    </p>
                  </div>
                  <StatusBadge value={s.result!} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
