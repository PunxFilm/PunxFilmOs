import Link from "next/link";

export const metadata = { title: "Privacy · PunxFilm OS" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-[var(--muted-foreground)] underline">
        ← PunxFilm OS
      </Link>
      <h1 className="text-3xl font-semibold mt-6">Informativa sulla privacy</h1>
      <div className="prose prose-sm mt-6 space-y-4 text-[var(--foreground)]">
        <p>
          PunxFilm OS raccoglie solo i dati strettamente necessari per gestire la distribuzione
          dei tuoi film: nome, email, materiali caricati, piani di distribuzione, submission. I
          dati sono ospitati su infrastruttura europea (Railway EU) e non vengono condivisi con
          terzi ad esclusione dei servizi tecnici indicati sotto.
        </p>
        <h2 className="text-xl font-semibold">Base giuridica (GDPR)</h2>
        <p>
          Trattiamo i dati sulla base del contratto (art. 6.1.b GDPR) per fornirti il servizio, e
          del legittimo interesse per il miglioramento della piattaforma.
        </p>
        <h2 className="text-xl font-semibold">Servizi terzi</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Railway</strong> (hosting + database) — fornitore cloud EU.
          </li>
          <li>
            <strong>Anthropic</strong> (Claude API) — analisi AI dei film. Nessun dato personale
            viene inviato oltre al titolo/descrizione del film che tu scegli di analizzare.
          </li>
          <li>
            <strong>Resend</strong> (opzionale) — invio email di alert deadline, se hai attivato
            le notifiche.
          </li>
        </ul>
        <h2 className="text-xl font-semibold">I tuoi diritti</h2>
        <p>
          Puoi accedere, modificare o cancellare i tuoi dati in qualsiasi momento dalla pagina
          Profilo. Per richieste di cancellazione completa o esportazione scrivi a
          privacy@punxfilm.it.
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Ultimo aggiornamento: aprile 2026
        </p>
      </div>
    </div>
  );
}
