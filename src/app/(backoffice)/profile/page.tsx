"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/page-header";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
    else if (session?.user?.email) setName("");
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "error", text: data.error || "Errore nel salvataggio" });
      return;
    }
    setMessage({ type: "success", text: "Profilo aggiornato" });
    await update();
  };

  if (!session) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Profilo" subtitle="Gestisci il tuo account" />

      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-3">Dati account</h3>
          <form onSubmit={handleSave} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={session.user.email || ""}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-sm"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                L&apos;email non può essere modificata
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ruolo</label>
              <input
                type="text"
                value={session.user.role}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-sm capitalize"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
