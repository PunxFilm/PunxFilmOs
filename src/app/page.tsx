export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-[var(--foreground)]">
          PunxFilm OS
        </h1>
        <p className="text-xl text-[var(--muted-foreground)] max-w-md mx-auto">
          Film Festival Distribution Management Platform
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Backoffice
          </a>
          <a
            href="/portal/dashboard"
            className="px-6 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors"
          >
            Portale Cliente
          </a>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] pt-8">
          v2.0.0-alpha &middot; Multi-tenant SaaS
        </p>
      </div>
    </div>
  );
}
