"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";

interface Prefs {
  timezone: string;
  locale: string;
  emailAlertsDeadline: boolean;
  emailAlertsResults: boolean;
}

const TIMEZONES = [
  { value: "Europe/Rome", label: "Europe/Rome (CET/CEST)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "America/New_York", label: "America/New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT)" },
  { value: "UTC", label: "UTC" },
];

const LOCALES = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    timezone: "Europe/Rome",
    locale: "it",
    emailAlertsDeadline: true,
    emailAlertsResults: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.prefs) setPrefs(data.prefs);
        setLoading(false);
      });
  }, []);

  const update = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "error", text: "Errore nel salvataggio" });
      return;
    }
    setMessage({ type: "success", text: "Preferenze salvate" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Impostazioni" subtitle="Caricamento..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Impostazioni" subtitle="Configurazione del tuo account" />

      <form onSubmit={handleSave} className="space-y-6">
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Preferenze lingua/timezone */}
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Località</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fuso orario</label>
              <select
                value={prefs.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lingua</label>
              <select
                value={prefs.locale}
                onChange={(e) => update("locale", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                {LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifiche email */}
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Notifiche email</h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.emailAlertsDeadline}
              onChange={(e) => update("emailAlertsDeadline", e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Alert deadline imminenti</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Ricevi email quando una deadline nei tuoi piani distribuzione è a ≤7 giorni.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.emailAlertsResults}
              onChange={(e) => update("emailAlertsResults", e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Risultati submission</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Ricevi email quando aggiorni lo status di una submission (selezione, premio,
                rifiuto).
              </p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva preferenze"}
        </button>
      </form>

      {/* Info piattaforma */}
      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-2">
        <h3 className="font-semibold text-sm">Informazioni piattaforma</h3>
        <div className="text-sm space-y-1 text-[var(--muted-foreground)]">
          <p>
            <span className="font-medium text-[var(--foreground)]">Versione:</span> 2.0.0-alpha
          </p>
          <p>
            <span className="font-medium text-[var(--foreground)]">Framework:</span> Next.js 14
            + Prisma + NextAuth v5
          </p>
          <p>
            Il seed dei dati iniziali si esegue da riga di comando con{" "}
            <code className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">
              npx tsx prisma/seed.ts
            </code>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
