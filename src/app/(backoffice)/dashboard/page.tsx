import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icon";
import {
  DeadlineCell,
  MatchBar,
  QualifyingDots,
  fmtDate,
  fmtMoney,
  daysBetween,
} from "@/components/ui-atoms";

export default async function DashboardPage() {
  const now = new Date();
  const in14days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    filmInDistribuzione,
    filmOnboarding,
    draftCount,
    submittedCount,
    acceptedCount,
    rejectedCount,
    expenseAggr,
    prizeAggr,
    upcomingEditions,
    draftSubmissions,
    recentResults,
    recentSubmissions,
    filmsList,
    urgentTasks,
  ] = await Promise.all([
    prisma.film.count({ where: { status: "in_distribuzione" } }),
    prisma.film.count({ where: { status: "onboarding" } }),
    prisma.submission.count({ where: { status: "draft" } }),
    prisma.submission.count({ where: { status: "submitted" } }),
    prisma.submission.count({ where: { status: "accepted" } }),
    prisma.submission.count({ where: { status: "rejected" } }),
    prisma.financeEntry.aggregate({
      _sum: { amount: true },
      where: { type: "expense", date: { gte: yearStart } },
    }),
    prisma.financeEntry.aggregate({
      _sum: { amount: true },
      where: { type: "income", date: { gte: yearStart } },
    }),
    prisma.festivalEdition.findMany({
      where: {
        OR: [
          { deadlineGeneral: { gte: now, lte: in14days } },
          { deadlineEarly: { gte: now, lte: in14days } },
        ],
      },
      orderBy: { deadlineGeneral: "asc" },
      include: { festivalMaster: true },
      take: 12,
    }),
    prisma.submission.findMany({
      where: { status: "draft" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        film: true,
        festivalEdition: { include: { festivalMaster: true } },
      },
    }),
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
    prisma.submission.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        film: true,
        festivalEdition: { include: { festivalMaster: true } },
      },
    }),
    prisma.film.findMany({
      where: { status: { in: ["in_distribuzione", "onboarding"] } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.task.findMany({
      where: { status: { not: "done" }, priority: { in: ["high", "medium"] } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 5,
      include: { film: true },
    }).catch(() => [] as Array<never>),
  ]);

  const totalDecided = acceptedCount + rejectedCount;
  const tasso =
    totalDecided > 0
      ? `${Math.round((acceptedCount / totalDecided) * 100)}%`
      : "—";
  const budgetSpeso = expenseAggr._sum.amount ?? 0;
  const premi = prizeAggr._sum.amount ?? 0;
  const bilancio = premi - budgetSpeso;

  const pipelineTotal = draftCount + submittedCount + acceptedCount + rejectedCount || 1;
  const pipelineRows = [
    { k: "draft", label: "Bozza", count: draftCount, color: "var(--fg-3)" },
    { k: "submitted", label: "Inviata", count: submittedCount, color: "var(--info)" },
    { k: "accepted", label: "Accettata", count: acceptedCount, color: "var(--ok)" },
    { k: "rejected", label: "Respinta", count: rejectedCount, color: "var(--accent)" },
  ];

  const todayLabel = now.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Buongiorno, Simone</h1>
          <div className="page-sub">
            {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} · Stagione{" "}
            {now.getFullYear()}
          </div>
        </div>
        <div className="page-head-actions">
          <Link href="/reports" className="btn">
            <Icon name="download" size={12} />
            Export report
          </Link>
          <Link href="/submissions/new" className="btn accent">
            <Icon name="plus" size={12} />
            Nuova iscrizione
          </Link>
        </div>
      </div>

      <div style={{ padding: "16px 24px" }}>
        {/* KPI row */}
        <div className="grid-4" style={{ marginBottom: 16 }}>
          <div className="kpi">
            <div className="kpi-label">Film in distribuzione</div>
            <div className="kpi-value">{filmInDistribuzione + filmOnboarding}</div>
            <div className="kpi-sub">
              <span>{filmOnboarding} onboarding</span>
              <span className="sep" />
              <span>{filmInDistribuzione} attivi</span>
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Iscrizioni attive</div>
            <div className="kpi-value">{draftCount + submittedCount}</div>
            <div className="kpi-sub">
              <span>{draftCount} bozze</span>
              <span className="sep" />
              <span>{submittedCount} inviate</span>
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Tasso accettazione</div>
            <div className="kpi-value">{tasso}</div>
            <div className="kpi-sub">
              <span className="u-num">
                {acceptedCount}/{totalDecided}
              </span>
              <span>decise</span>
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Bilancio {now.getFullYear()}</div>
            <div className="kpi-value mono">{fmtMoney(bilancio)}</div>
            <div className="kpi-sub">
              <span className="u-num">{fmtMoney(budgetSpeso)}</span> spesi
              <span className="sep" />
              <span className="u-num" style={{ color: "var(--ok)" }}>
                +{fmtMoney(premi)}
              </span>{" "}
              premi
            </div>
          </div>
        </div>

        <div className="grid-dash">
          {/* LEFT column */}
          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Deadline prossimi 14 giorni</span>
                <span className="chip mono" style={{ fontSize: 10.5 }}>
                  {upcomingEditions.length}
                </span>
                <div style={{ marginLeft: "auto" }} className="row gap-2">
                  <Link href="/calendar" className="btn sm ghost">
                    Calendario completo →
                  </Link>
                </div>
              </div>
              {upcomingEditions.length === 0 ? (
                <div className="card-body muted">
                  Nessuna deadline nei prossimi 14 giorni.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>Countdown</th>
                      <th>Festival</th>
                      <th>Città</th>
                      <th>Qualifying</th>
                      <th>Fee</th>
                      <th style={{ width: 40 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingEditions.map((ed) => {
                      const nearest =
                        ed.deadlineEarly && new Date(ed.deadlineEarly) >= now
                          ? { d: ed.deadlineEarly, t: "early" }
                          : { d: ed.deadlineGeneral, t: "reg" };
                      return (
                        <tr key={ed.id}>
                          <td>
                            <DeadlineCell date={nearest.d} type={nearest.t} />
                          </td>
                          <td>
                            <Link
                              href={`/festivals/${ed.festivalMasterId}`}
                              className="t-title serif"
                              style={{ fontSize: 14 }}
                            >
                              {ed.festivalMaster.name}
                            </Link>
                          </td>
                          <td className="t-sub">{ed.festivalMaster.city}</td>
                          <td>
                            <QualifyingDots
                              fes={{
                                academy: ed.festivalMaster.academyQualifying,
                                bafta: ed.festivalMaster.baftaQualifying,
                                efa: ed.festivalMaster.efaQualifying,
                                goya: ed.festivalMaster.goyaQualifying,
                              }}
                            />
                          </td>
                          <td className="u-num">
                            {ed.feeAmount == null
                              ? "—"
                              : ed.feeAmount === 0
                                ? "free"
                                : fmtMoney(ed.feeAmount, ed.feeCurrency)}
                          </td>
                          <td>
                            <Link
                              href={`/festivals/${ed.festivalMasterId}`}
                              className="icon-btn"
                            >
                              <Icon
                                name="chev"
                                size={12}
                                style={{ color: "var(--fg-4)" }}
                              />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Attività recente */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Attività recente</span>
              </div>
              <div className="card-body flush">
                {recentSubmissions.length === 0 ? (
                  <div className="card-body muted">Nessuna attività recente.</div>
                ) : (
                  recentSubmissions.map((s) => {
                    const when = fmtDate(s.updatedAt);
                    const color =
                      s.status === "accepted"
                        ? "ok"
                        : s.status === "rejected"
                          ? "accent"
                          : s.status === "submitted"
                            ? "info"
                            : "";
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 1fr auto",
                          gap: 12,
                          padding: "11px 14px",
                          borderBottom: "1px solid var(--border)",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: color ? `var(--${color}-bg)` : "var(--bg-2)",
                            color: color ? `var(--${color})` : "var(--fg-3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon
                            name={
                              s.status === "accepted"
                                ? "check"
                                : s.status === "submitted"
                                  ? "submit"
                                  : s.status === "rejected"
                                    ? "close"
                                    : "mail"
                            }
                            size={12}
                          />
                        </span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                            {s.film.titleOriginal}
                          </div>
                          <div className="tiny">
                            → {s.festivalEdition.festivalMaster.name}
                          </div>
                        </div>
                        <span className="tiny u-num">{when}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT column */}
          <div className="col" style={{ gap: 16 }}>
            {/* Bozze in sospeso */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Bozze in sospeso</span>
                <span className="badge accent" style={{ marginLeft: "auto" }}>
                  {draftSubmissions.length}
                </span>
              </div>
              <div className="card-body" style={{ padding: 8 }}>
                {draftSubmissions.length === 0 ? (
                  <div className="tiny" style={{ padding: 8 }}>
                    Nessuna bozza aperta.
                  </div>
                ) : (
                  draftSubmissions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/submissions/${s.id}`}
                      style={{
                        padding: "8px 6px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.film.titleOriginal}
                        </div>
                        <div className="tiny">
                          {s.festivalEdition.festivalMaster.name}
                        </div>
                      </div>
                      <span className="badge">Bozza</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Film attivi */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">I tuoi film</span>
                <Link
                  href="/films"
                  className="btn sm ghost"
                  style={{ marginLeft: "auto" }}
                >
                  Tutti →
                </Link>
              </div>
              <div
                className="card-body"
                style={{
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {filmsList.length === 0 ? (
                  <div className="tiny">Nessun film attivo.</div>
                ) : (
                  filmsList.map((f) => (
                    <Link
                      key={f.id}
                      href={`/films/${f.id}`}
                      style={{ display: "flex", gap: 10 }}
                    >
                      <div style={{ width: 40 }}>
                        <div className="poster sm">
                          <div className="p-title">{f.titleOriginal.slice(0, 12)}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="serif"
                          style={{
                            fontSize: 14,
                            color: "var(--fg)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.titleOriginal}
                        </div>
                        <div
                          className="tiny"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {f.director || "—"}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Risultati recenti */}
            {recentResults.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <span className="card-title">Risultati recenti</span>
                </div>
                <div className="card-body" style={{ padding: 8 }}>
                  {recentResults.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "8px 6px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                        {s.film.titleOriginal}
                      </div>
                      <div className="tiny row gap-2">
                        <span>{s.festivalEdition.festivalMaster.name}</span>
                        <span
                          className={`badge ${s.status === "accepted" ? "ok" : "accent"}`}
                        >
                          {s.status === "accepted" ? "Accettata" : "Respinta"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Pipeline iscrizioni</span>
              </div>
              <div className="card-body" style={{ padding: 14 }}>
                {pipelineRows.map((s) => {
                  const pct = (s.count / pipelineTotal) * 100;
                  return (
                    <div key={s.k} style={{ marginBottom: 10 }}>
                      <div className="between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12 }}>{s.label}</span>
                        <span className="u-num tiny">
                          {s.count} · {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="progress">
                        <div
                          className="bar"
                          style={{ width: `${pct}%`, background: s.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task urgenti */}
            {urgentTasks.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <span className="card-title">Task urgenti</span>
                </div>
                <div className="card-body" style={{ padding: 8 }}>
                  {urgentTasks.map((t) => {
                    const dd = daysBetween(t.dueDate, now);
                    return (
                      <Link
                        key={t.id}
                        href={`/tasks/${t.id}`}
                        style={{
                          padding: "8px 6px",
                          borderBottom: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                            {t.title}
                          </div>
                          {t.film && <div className="tiny">{t.film.titleOriginal}</div>}
                        </div>
                        {dd != null && (
                          <span
                            className={`badge ${dd <= 1 ? "accent" : dd <= 7 ? "warn" : ""}`}
                          >
                            T−{dd}g
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
