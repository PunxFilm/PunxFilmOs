import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { computeEditionStatus, formatDate, daysUntil, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in14days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  /* ── KPI queries ────────────────────────────── */

  const [
    filmInDistribuzione,
    iscrizioniAttive,
    acceptedCount,
    rejectedCount,
    expenseAggr,
    // Deadline queries
    deadlines7,
    deadlines14,
    // Azioni urgenti
    filmsWithMissing,
    draftSubmissions,
    recentResults,
    // Attivita recente
    recentSubmissions,
    recentPlanEntries,
  ] = await Promise.all([
    // KPI 1: Film in distribuzione (onboarding + in_distribuzione)
    prisma.film.count({
      where: { status: { in: ["in_distribuzione", "onboarding"] } },
    }),
    // KPI 2: Iscrizioni attive (draft + submitted)
    prisma.submission.count({
      where: { status: { in: ["draft", "submitted"] } },
    }),
    // KPI 3a: accepted count
    prisma.submission.count({ where: { status: "accepted" } }),
    // KPI 3b: rejected count
    prisma.submission.count({ where: { status: "rejected" } }),
    // KPI 4: Budget speso quest'anno
    prisma.financeEntry.aggregate({
      _sum: { amount: true },
      where: { type: "expense", date: { gte: yearStart } },
    }),

    // Deadline questa settimana (general OR early within 7 days)
    prisma.festivalEdition.findMany({
      where: {
        OR: [
          { deadlineGeneral: { gte: now, lte: in7days } },
          { deadlineEarly: { gte: now, lte: in7days } },
        ],
      },
      orderBy: { deadlineGeneral: "asc" },
      include: { festivalMaster: true },
    }),
    // Deadline prossimi 14 giorni (exclude those already in 7-day window)
    prisma.festivalEdition.findMany({
      where: {
        OR: [
          { deadlineGeneral: { gt: in7days, lte: in14days } },
          { deadlineEarly: { gt: in7days, lte: in14days } },
        ],
      },
      orderBy: { deadlineGeneral: "asc" },
      include: { festivalMaster: true },
    }),

    // Films with missing materials
    prisma.film.findMany({
      where: {
        status: { in: ["in_distribuzione", "onboarding"] },
        materials: { some: { status: "missing", isRequired: true } },
      },
      include: {
        materials: { where: { isRequired: true } },
      },
      take: 10,
    }),
    // Submissions in draft
    prisma.submission.findMany({
      where: { status: "draft" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        film: true,
        festivalEdition: { include: { festivalMaster: true } },
      },
    }),
    // Recent results (accepted/rejected last 7 days)
    prisma.submission.findMany({
      where: {
        status: { in: ["accepted", "rejected"] },
        updatedAt: { gte: sevenDaysAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        film: true,
        festivalEdition: { include: { festivalMaster: true } },
      },
    }),

    // Attivita recente: submissions
    prisma.submission.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        film: true,
        festivalEdition: { include: { festivalMaster: true } },
      },
    }),
    // Attivita recente: plan entries
    prisma.planEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        festivalMaster: true,
        plan: { include: { film: true } },
      },
    }),
  ]);

  /* ── Computed values ────────────────────────── */

  const totalDecided = acceptedCount + rejectedCount;
  const tassoAccettazione =
    totalDecided > 0
      ? `${Math.round((acceptedCount / totalDecided) * 100)}%`
      : "\u2014";

  const budgetSpeso = expenseAggr._sum.amount ?? 0;

  const kpis = [
    {
      label: "Film in distribuzione",
      value: filmInDistribuzione,
      sub: "Onboarding + attivi",
    },
    {
      label: "Iscrizioni attive",
      value: iscrizioniAttive,
      sub: "Bozze + inviate",
    },
    {
      label: "Tasso accettazione",
      value: tassoAccettazione,
      sub: totalDecided > 0 ? `${acceptedCount}/${totalDecided} decise` : "Nessun esito",
    },
    {
      label: "Budget speso",
      value: formatCurrency(budgetSpeso),
      sub: `Anno ${now.getFullYear()}`,
    },
  ];

  /* ── Material completion helper ─────────────── */

  function materialCompletionPct(
    materials: { status: string; isRequired: boolean }[]
  ): number {
    const required = materials.filter((m) => m.isRequired);
    if (required.length === 0) return 100;
    const done = required.filter((m) => m.status !== "missing").length;
    return Math.round((done / required.length) * 100);
  }

  /* ── Deadline card helper ───────────────────── */

  function DeadlineCard({
    edition,
  }: {
    edition: (typeof deadlines7)[number];
  }) {
    const edStatus = computeEditionStatus(edition);
    const nearestDeadline = edition.deadlineEarly
      ? new Date(edition.deadlineEarly) <= in7days
        ? edition.deadlineEarly
        : edition.deadlineGeneral
      : edition.deadlineGeneral;
    const days = daysUntil(nearestDeadline);
    const countdownText =
      days === 0
        ? "Oggi"
        : days === 1
          ? "Domani"
          : days !== null
            ? `Tra ${days} giorni`
            : "";

    return (
      <div className="flex items-start justify-between gap-2 py-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/festivals/${edition.festivalMasterId}`}
            className="font-medium text-sm hover:underline truncate block"
          >
            {edition.festivalMaster.name}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${edStatus.color}`}
            >
              {edStatus.label}
            </span>
            {edition.feeAmount != null && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {edition.feeCurrency} {edition.feeAmount}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-medium text-[var(--accent)]">
            {formatDate(nearestDeadline)}
          </span>
          {countdownText && (
            <p className="text-xs text-[var(--muted-foreground)]">
              {countdownText}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">
          Panoramica operativa distributore
        </p>
      </div>

      {/* ── Section 1: KPI Cards ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
          >
            <p className="text-sm text-[var(--muted-foreground)]">
              {card.label}
            </p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Section 2 + 3: Two columns ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Deadline */}
        <div className="space-y-6">
          {/* Deadline questa settimana */}
          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <h3 className="font-semibold mb-4">
              Deadline questa settimana
            </h3>
            {deadlines7.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nessuna deadline nei prossimi 7 giorni.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {deadlines7.map((ed) => (
                  <DeadlineCard key={ed.id} edition={ed} />
                ))}
              </div>
            )}
          </div>

          {/* Deadline prossimi 14 giorni */}
          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <h3 className="font-semibold mb-4">
              Deadline prossimi 14 giorni
            </h3>
            {deadlines14.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nessuna deadline aggiuntiva.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {deadlines14.map((ed) => (
                  <DeadlineCard key={ed.id} edition={ed} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Azioni urgenti */}
        <div className="space-y-6">
          {/* Materiali mancanti */}
          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <h3 className="font-semibold mb-4">Materiali incompleti</h3>
            {filmsWithMissing.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Tutti i materiali richiesti sono presenti.
              </p>
            ) : (
              <div className="space-y-3">
                {filmsWithMissing.map((film) => {
                  const pct = materialCompletionPct(film.materials);
                  return (
                    <div key={film.id}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/films/${film.id}`}
                          className="font-medium text-sm hover:underline truncate"
                        >
                          {film.titleOriginal}
                        </Link>
                        <span className="text-xs font-medium text-[var(--muted-foreground)] shrink-0 ml-2">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bozze da completare */}
          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <h3 className="font-semibold mb-4">Iscrizioni in bozza</h3>
            {draftSubmissions.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nessuna bozza in sospeso.
              </p>
            ) : (
              <div className="space-y-3">
                {draftSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sub.film.titleOriginal}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {sub.festivalEdition.festivalMaster.name}
                      </p>
                    </div>
                    <StatusBadge value="draft" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risultati recenti */}
          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <h3 className="font-semibold mb-4">Risultati recenti</h3>
            {recentResults.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nessun risultato negli ultimi 7 giorni.
              </p>
            ) : (
              <div className="space-y-3">
                {recentResults.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sub.film.titleOriginal}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {sub.festivalEdition.festivalMaster.name}
                      </p>
                    </div>
                    <StatusBadge value={sub.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 4: Attivita recente ───────── */}
      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <h3 className="font-semibold mb-4">Attivita recente</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ultime iscrizioni */}
          <div>
            <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
              Ultime iscrizioni
            </h4>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nessuna iscrizione recente.
              </p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sub.film.titleOriginal}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {sub.festivalEdition.festivalMaster.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge value={sub.status} />
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(sub.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ultimi piani */}
          <div>
            <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
              Ultimi piani aggiornati
            </h4>
            {recentPlanEntries.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nessun piano recente.
              </p>
            ) : (
              <div className="space-y-3">
                {recentPlanEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.plan.film.titleOriginal}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {entry.festivalMaster.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge value={entry.status} />
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
