import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const primaryHref = session ? "/dashboard" : "/register";
  const primaryLabel = session ? "Vai alla dashboard" : "Crea un account";
  const secondaryHref = session ? "/dashboard" : "/login";
  const secondaryLabel = session ? "Dashboard" : "Accedi";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
        <Link href="/" className="font-semibold">
          PunxFilm OS
        </Link>
        <nav className="flex gap-4 text-sm">
          {session ? (
            <Link href="/dashboard" className="font-medium">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login">Accedi</Link>
              <Link href="/register" className="font-medium">
                Registrati
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight">PunxFilm OS</h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            La piattaforma AI-native per la distribuzione di cortometraggi a festival
            cinematografici.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6">
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <h3 className="font-semibold text-sm mb-1">1.800+ festival</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Oscar, BAFTA, EFA qualifying con deadline, fee e premi aggiornati.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <h3 className="font-semibold text-sm mb-1">Piani AI-assisted</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Claude suggerisce premiere + queue ottimale per ogni film.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <h3 className="font-semibold text-sm mb-1">Tracking end-to-end</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Submission, materiali, waiver, finance, deadline — in un solo posto.
              </p>
            </div>
          </div>
          <div className="flex gap-4 justify-center pt-6">
            <Link
              href={primaryHref}
              className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="px-6 py-3 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] flex flex-wrap justify-between gap-2">
        <span>
          © {new Date().getFullYear()} PunxFilm OS &middot; v2.0.0-alpha &middot; Multi-tenant
          SaaS
        </span>
        <span className="flex gap-4">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          <Link href="/terms" className="underline">
            Termini
          </Link>
        </span>
      </footer>
    </div>
  );
}
