import { prisma } from "@/lib/prisma";
import { computeMasterCompleteness } from "@/lib/completeness";
import Link from "next/link";

function InlineBar({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const barColor =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    score >= 70 ? "text-emerald-700" : score >= 40 ? "text-amber-700" : "text-red-700";
  const h = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} rounded-full bg-[var(--muted)] overflow-hidden`}>
        <div
          className={`${h} rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${textColor} whitespace-nowrap`}>
        {Math.round(score)}%
      </span>
    </div>
  );
}

function HorizontalBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 truncate text-[var(--muted-foreground)]">{label || "N/D"}</span>
      <div className="flex-1 h-5 rounded bg-[var(--muted)] overflow-hidden">
        <div
          className="h-5 rounded bg-[var(--primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium w-10 text-right">{count}</span>
    </div>
  );
}

export default async function FestivalAnalyticsPage() {
  const currentYear = new Date().getFullYear();

  const [
    totalActive,
    byClassification,
    byType,
    topCountries,
    byVerification,
    academyCount,
    totalEditions,
    editionsWithDeadline,
    allMasters,
  ] = await Promise.all([
    prisma.festivalMaster.count({ where: { isActive: true } }),
    prisma.festivalMaster.groupBy({
      by: ["classification"],
      _count: true,
      where: { isActive: true },
    }),
    prisma.festivalMaster.groupBy({
      by: ["type"],
      _count: true,
      where: { isActive: true },
    }),
    prisma.festivalMaster.groupBy({
      by: ["country"],
      _count: true,
      where: { isActive: true },
      orderBy: { _count: { country: "desc" } },
      take: 20,
    }),
    prisma.festivalMaster.groupBy({
      by: ["verificationStatus"],
      _count: true,
      where: { isActive: true },
    }),
    prisma.festivalMaster.count({
      where: { isActive: true, academyQualifying: true },
    }),
    prisma.festivalEdition.count(),
    prisma.festivalEdition.count({
      where: { deadlineGeneral: { not: null } },
    }),
    prisma.festivalMaster.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        classification: true,
        type: true,
        website: true,
        submissionUrlBase: true,
        submissionPlatform: true,
        contactEmailInfo: true,
        contactEmailDirector: true,
        contactEmailTechnical: true,
        contactName: true,
        maxMinutes: true,
        acceptedGenres: true,
        acceptedThemes: true,
        focus: true,
        qualityScore: true,
        punxRating: true,
        screeningType: true,
        dcp: true,
        travelSupport: true,
        hospitalitySupport: true,
        verificationStatus: true,
        industry: true,
        acceptsFirstWork: true,
      },
    }),
  ]);

  // Compute completeness scores
  const scores = allMasters.map((m) => ({
    ...m,
    completeness: computeMasterCompleteness(m as Record<string, unknown>).score,
  }));
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, m) => s + m.completeness, 0) / scores.length)
      : 0;
  const excellent = scores.filter((m) => m.completeness >= 70).length;
  const good = scores.filter((m) => m.completeness >= 40 && m.completeness < 70).length;
  const needsWork = scores.filter((m) => m.completeness < 40).length;
  const toResearch = scores
    .filter((m) => m.completeness < 50 && m.verificationStatus === "unverified")
    .sort((a, b) => a.completeness - b.completeness)
    .slice(0, 20);

  // Find festivals missing an edition for current year
  const mastersWithLatestEdition = await prisma.festivalMaster.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      editions: {
        orderBy: { year: "desc" },
        take: 1,
        select: { year: true },
      },
    },
  });
  const missingEditions = mastersWithLatestEdition
    .filter((m) => m.editions.length === 0 || m.editions[0].year < currentYear)
    .map((m) => ({
      id: m.id,
      name: m.name,
      lastYear: m.editions.length > 0 ? m.editions[0].year : null,
    }))
    .sort((a, b) => (b.lastYear ?? 0) - (a.lastYear ?? 0))
    .slice(0, 30);

  // Helpers
  const verifiedCount =
    byVerification.find((v) => v.verificationStatus === "verified")?._count ?? 0;
  const maxClassCount = Math.max(...byClassification.map((c) => c._count), 1);
  const maxTypeCount = Math.max(...byType.map((t) => t._count), 1);
  const maxCountryCount = topCountries.length > 0 ? topCountries[0]._count : 1;
  const completenessTotal = excellent + good + needsWork;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Festival Analytics</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Panoramica database festival - {totalActive} festival attivi, {totalEditions} edizioni
          </p>
        </div>
        <Link
          href="/festivals"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          Torna alla lista
        </Link>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Totale Festival</p>
          <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{totalActive}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Academy Qualifying</p>
          <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{academyCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Verificati</p>
          <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{verifiedCount}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            su {totalActive} totali
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Completezza Media</p>
          <p
            className={`text-3xl font-bold mt-1 ${
              avgScore >= 70
                ? "text-emerald-600"
                : avgScore >= 40
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {avgScore}%
          </p>
          <div className="mt-2">
            <InlineBar score={avgScore} size="sm" />
          </div>
        </div>
      </div>

      {/* Row 2: Distribution + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Distribuzione</h2>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Per classificazione
            </h3>
            {byClassification
              .sort((a, b) => b._count - a._count)
              .map((c) => (
                <HorizontalBar
                  key={c.classification ?? "null"}
                  label={c.classification ?? "Non specificato"}
                  count={c._count}
                  max={maxClassCount}
                />
              ))}
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-1">
            <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Per tipo</h3>
            {byType
              .sort((a, b) => b._count - a._count)
              .map((t) => (
                <HorizontalBar
                  key={t.type ?? "null"}
                  label={t.type ?? "Non specificato"}
                  count={t._count}
                  max={maxTypeCount}
                />
              ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Paesi principali
          </h2>
          <div className="space-y-1">
            {topCountries.map((c) => (
              <HorizontalBar
                key={c.country}
                label={c.country}
                count={c._count}
                max={maxCountryCount}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Data Completeness */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Completezza Dati</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{excellent}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Eccellente (&ge;70%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{good}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Buona (40-70%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{needsWork}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Da migliorare (&lt;40%)
            </p>
          </div>
        </div>

        {/* Distribution bar */}
        {completenessTotal > 0 && (
          <div className="flex h-4 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(excellent / completenessTotal) * 100}%` }}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${(good / completenessTotal) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(needsWork / completenessTotal) * 100}%` }}
            />
          </div>
        )}

        <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
          <span>Edizioni totali: {totalEditions}</span>
          <span>Con deadline: {editionsWithDeadline}</span>
        </div>
      </div>

      {/* Row 4: Research + Missing Editions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Festivals to research */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Festival da ricercare
          </h2>
          {toResearch.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Nessun festival da ricercare - ottimo lavoro!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 text-[var(--muted-foreground)] font-medium">
                      Nome
                    </th>
                    <th className="text-left py-2 text-[var(--muted-foreground)] font-medium">
                      Luogo
                    </th>
                    <th className="text-left py-2 text-[var(--muted-foreground)] font-medium w-32">
                      Completezza
                    </th>
                    <th className="text-right py-2 text-[var(--muted-foreground)] font-medium">
                      Azione
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {toResearch.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2">
                        <Link
                          href={`/festivals/${f.id}`}
                          className="text-[var(--primary)] hover:underline font-medium"
                        >
                          {f.name}
                        </Link>
                      </td>
                      <td className="py-2 text-[var(--muted-foreground)]">
                        {f.city}, {f.country}
                      </td>
                      <td className="py-2">
                        <InlineBar score={f.completeness} size="sm" />
                      </td>
                      <td className="py-2 text-right">
                        <Link
                          href={`/festivals/${f.id}/edit`}
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          Modifica
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Missing editions */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Edizioni mancanti {currentYear}
          </h2>
          {missingEditions.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Tutti i festival hanno un&apos;edizione {currentYear}!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 text-[var(--muted-foreground)] font-medium">
                      Nome
                    </th>
                    <th className="text-left py-2 text-[var(--muted-foreground)] font-medium">
                      Ultima edizione
                    </th>
                    <th className="text-right py-2 text-[var(--muted-foreground)] font-medium">
                      Azione
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {missingEditions.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2">
                        <Link
                          href={`/festivals/${f.id}`}
                          className="text-[var(--primary)] hover:underline font-medium"
                        >
                          {f.name}
                        </Link>
                      </td>
                      <td className="py-2 text-[var(--muted-foreground)]">
                        {f.lastYear ?? "Nessuna"}
                      </td>
                      <td className="py-2 text-right">
                        <Link
                          href={`/festivals/${f.id}/editions/new`}
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          Crea edizione
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
