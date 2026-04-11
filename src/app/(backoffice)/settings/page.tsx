"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    if (!confirm("Questo cancellerà tutti i dati esistenti e li sostituirà con dati demo. Continuare?")) return;
    setSeeding(true);
    setMessage("");
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    setMessage(data.message || "Fatto!");
    setSeeding(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Impostazioni" subtitle="Configurazione della piattaforma" />

      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
        <div>
          <h3 className="font-semibold">Informazioni</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p><span className="text-[var(--muted-foreground)]">Versione:</span> 2.0.0-alpha</p>
            <p><span className="text-[var(--muted-foreground)]">Database:</span> SQLite (locale)</p>
            <p><span className="text-[var(--muted-foreground)]">Framework:</span> Next.js 14 + Prisma</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
        <div>
          <h3 className="font-semibold">Dati Demo</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Carica dati di esempio per esplorare la piattaforma. Tutti i dati esistenti verranno sostituiti.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {seeding ? "Caricamento..." : "Carica Dati Demo"}
          </button>
          {message && <p className="text-sm text-green-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}
