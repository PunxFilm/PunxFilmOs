"use client";

import { useState } from "react";

export interface CreatedFestival {
  id: string;
  name: string;
}

export function CreateFestivalModal({
  open,
  initialName,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (fm: CreatedFestival) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) {
      setErr("Il nome è obbligatorio");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/import/create-festival-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          country: country.trim() || undefined,
          city: city.trim() || undefined,
          website: website.trim() || undefined,
          email: email.trim() || undefined,
          category: category.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Errore creazione festival");
        setSubmitting(false);
        return;
      }
      const created = (await res.json()) as CreatedFestival;
      onCreated(created);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          width: "min(520px, 94vw)",
          background: "var(--card)",
          borderColor: "var(--border-strong)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold">Crea nuovo festival</h3>
        </div>
        <div className="p-4 space-y-3">
          <Field
            label="Nome"
            value={name}
            onChange={setName}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Paese" value={country} onChange={setCountry} />
            <Field label="Città" value={city} onChange={setCity} />
          </div>
          <Field
            label="Sito web"
            value={website}
            onChange={setWebsite}
            placeholder="https://..."
          />
          <Field
            label="Email contatto"
            value={email}
            onChange={setEmail}
            placeholder="info@festival.com"
          />
          <Field
            label="Categoria"
            value={category}
            onChange={setCategory}
            placeholder="international, national, regional..."
          />
          {err && (
            <div
              className="text-xs px-3 py-2 rounded"
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent)",
              }}
            >
              {err}
            </div>
          )}
        </div>
        <div
          className="px-4 py-3 border-t flex justify-end gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={submitting}
          >
            Annulla
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={submitting || !name.trim()}
          >
            {submitting ? "Creo..." : "Crea festival"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium" style={{ color: "var(--fg-2)" }}>
        {label}
        {required && (
          <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 rounded text-sm"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
        }}
      />
    </div>
  );
}
