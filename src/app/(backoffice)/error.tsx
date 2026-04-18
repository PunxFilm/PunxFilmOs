"use client";

import { useEffect } from "react";

export default function BackofficeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log a debug line in browser console for remote diagnosis
    console.error("[BackofficeError]", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-red-700">
        Errore applicazione
      </h1>
      <div className="p-4 rounded-lg border border-red-300 bg-red-50 space-y-2">
        <p className="text-sm font-mono text-red-900 break-all">
          <strong>Messaggio:</strong> {error.message || "(nessun messaggio)"}
        </p>
        {error.name && (
          <p className="text-sm font-mono text-red-800">
            <strong>Tipo:</strong> {error.name}
          </p>
        )}
        {error.digest && (
          <p className="text-xs font-mono text-red-700">
            <strong>Digest:</strong> {error.digest}
          </p>
        )}
        {error.stack && (
          <details className="text-xs font-mono text-red-800 mt-2">
            <summary className="cursor-pointer font-medium">Stack trace</summary>
            <pre className="whitespace-pre-wrap mt-2 p-2 bg-red-100 rounded overflow-auto max-h-80">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium"
        >
          Riprova
        </button>
        <a
          href="/dashboard"
          className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm"
        >
          Torna alla dashboard
        </a>
      </div>
    </div>
  );
}
