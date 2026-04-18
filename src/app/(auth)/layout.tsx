import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="font-semibold">
          PunxFilm OS
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="px-6 py-4 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] text-center">
        © {new Date().getFullYear()} PunxFilm OS ·{" "}
        <Link href="/privacy" className="underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline">
          Termini
        </Link>
      </footer>
    </div>
  );
}
