export default function PortalDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Portale Cliente</h1>
        <p className="text-[var(--muted-foreground)] max-w-md">
          Il portale cliente è in fase di sviluppo. Qui i clienti potranno
          monitorare lo stato delle iscrizioni e i risultati dei festival.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--secondary)] transition-colors"
        >
          Torna alla Home
        </a>
      </div>
    </div>
  );
}
