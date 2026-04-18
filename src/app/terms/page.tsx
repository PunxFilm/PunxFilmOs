import Link from "next/link";

export const metadata = { title: "Termini · PunxFilm OS" };

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-[var(--muted-foreground)] underline">
        ← PunxFilm OS
      </Link>
      <h1 className="text-3xl font-semibold mt-6">Termini di servizio</h1>
      <div className="prose prose-sm mt-6 space-y-4 text-[var(--foreground)]">
        <p>
          Utilizzando PunxFilm OS accetti questi termini. Il servizio è offerto &quot;as is&quot;
          durante il periodo alpha. Ti impegni a non caricare contenuti illegali o di cui non
          detieni i diritti.
        </p>
        <h2 className="text-xl font-semibold">Account</h2>
        <p>
          Sei responsabile della sicurezza delle tue credenziali. Un solo account per persona
          fisica/azienda.
        </p>
        <h2 className="text-xl font-semibold">Contenuti</h2>
        <p>
          Mantieni tutti i diritti sui tuoi film, metadata e documenti caricati. Concedi a
          PunxFilm OS il permesso di elaborarli unicamente per fornirti il servizio (matching
          festival, analisi AI, tracking submission).
        </p>
        <h2 className="text-xl font-semibold">Cancellazione</h2>
        <p>
          Puoi cancellare il tuo account in qualsiasi momento. I dati vengono eliminati entro 30
          giorni dalla richiesta.
        </p>
        <h2 className="text-xl font-semibold">Limitazione di responsabilità</h2>
        <p>
          PunxFilm OS non garantisce l&apos;accettazione a festival. Le informazioni su deadline,
          fee e requisiti sono fornite a titolo informativo; la verifica finale è sempre
          responsabilità dell&apos;utente.
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Ultimo aggiornamento: aprile 2026
        </p>
      </div>
    </div>
  );
}
