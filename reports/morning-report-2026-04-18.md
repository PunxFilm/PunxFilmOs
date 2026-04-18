# PunxFilm OS — Report Mattutino
**Data:** sabato 18 aprile 2026 | **Giorno:** Sabato
**Generato da:** Direttore Generale AI

---

## DASHBOARD RAPIDO

| Metrica | Valore | Note |
|---------|--------|------|
| Film in database | 7 | 1 in_distribuzione, 6 onboarding |
| Festival Master | 1.814 | 121 verificati, 643 unverified, 1.053 da rinfrescare via AI |
| Edizioni Festival | 551 | 48 con deadline futura, 503 senza data compilata |
| Submission totali | 1 | 1 submitted (0 draft, 0 accepted/rejected) |
| Piani distribuzione | 1 | solo FEDELI ALLA LINEA; 6 film scoperti |
| Task aperte | 0 | pipeline task vuota |
| Spese totali | €0 | FinanceEntry vuota — nessun movimento registrato |
| Entrate totali | €0 | FinanceEntry vuota — nessun movimento registrato |
| Academy / BAFTA / EFA qualifying in DB | 229 / 53 / 57 | perimetro awards-oriented già importato |

---

## 1. REPARTO SCOUTING & FESTIVAL

### Situazione
Il database festival è largo (1.814 master + 551 edizioni) ma disomogeneo per qualità. Solo 121 festival (6,7%) sono contrassegnati come `verified`; 538 sono `ai_enriched`, 448 `ai_verified` e 643 restano `unverified`. Il campo `needsAiRefresh` è attivo su 1.053 record — oltre metà del dataset — e la qualità media (`qualityScore` ≈ 52/100, su 806 record) indica margini importanti di pulizia. Sul fronte edizioni, 503 su 551 (91%) non hanno `activeDeadlineDate` valorizzato: è il problema più urgente del reparto perché impedisce al sistema di suggerire le finestre di invio.

Contatti carenti: 1.347/1.814 master senza `contactEmailInfo`, 148 senza `website`. Si notano inoltre probabili duplicati da deduplicare (es. "Concorto Film Festival" vs "Concorto Short Film Festival", "Inventa un film – Lenolafilmfestival" vs "Inventa un Film – Festival Internazionale di Lenola", "Leeds International Film Festival" vs "Leeds International Film Festival (LIFF)").

### Deadline Imminenti (entro 7 giorni — 1)
| Data | Festival | Paese | Tipo | Fee |
|------|----------|-------|------|-----|
| 2026-04-23 | **Locarno Film Festival** (Pardi di domani — finestra late) | Svizzera | late | 130 USD |

### Prossime Scadenze (8-14 giorni — 11)
| Data | Festival | Paese | Tipo | Fee |
|------|----------|-------|------|-----|
| 2026-04-29 | Inventa un film – Lenolafilmfestival | Italia | late | 15 € |
| 2026-04-30 | Curtas Vila do Conde | Portogallo | general | 25 € |
| 2026-04-30 | DISFF – Drama International Short Film Festival | Grecia¹ | general | 25 € |
| 2026-04-30 | Film Festival Pino Scicolone | Italia | final | — |
| 2026-04-30 | Toko Film Festival | Italia | final | — |
| 2026-04-30 | Inventa un Film – Festival Internazionale di Lenola | Italia | general | 10 € |
| 2026-05-01 | Uppsala Short Film Festival | Svezia | final | 20 € |
| 2026-05-01 | Berlin Short Film Festival | Germania | final | 25 € |
| 2026-05-01 | Concorto Short Film Festival | Italia | final | — |
| 2026-05-01 | Concorto Film Festival | Italia | general | 6 € |
| 2026-05-01 | Macau International Short Film Festival | Cina | final | 20 USD |

¹ Il record è etichettato "Svizzera" ma DISFF è storicamente greco — da verificare.

### Finestra 15-30 giorni (4 principali)
Toronto International Film Festival (08/05, 95 USD), Fabriano Film Fest (15/05, late), Athens International Film Festival (15/05, 20 USD), Braunschweig IFF (17/05, 15 €).

### Azioni Pianificate (oggi)
1. Fixare i 503 record senza `activeDeadlineDate`: lanciare job di ricalcolo che derivi la data attiva dai campi `deadlineEarly/General/Late/Final`. Senza questo fix il reparto Distribuzione non può pianificare nulla.
2. Avviare batch AI refresh sui 1.053 festival con `needsAiRefresh=1` (prioritario sui master con `qualityScore < 40`).
3. Aprire task di dedupe sui duplicati identificati (Concorto, Lenola, Leeds).
4. Decidere oggi se inviare FEDELI ALLA LINEA al Locarno – Pardi di domani entro il 23/04 (vedere sezione Distribuzione).

---

## 2. REPARTO DISTRIBUZIONE & SUBMISSION

### Situazione
Pipeline sottodimensionata: **1 sola submission** attiva in tutto il sistema (FEDELI ALLA LINEA → Clermont-Ferrand ISFF, status `submitted`, nessuna notifica ancora registrata) e **1 piano di distribuzione** (anch'esso per FEDELI ALLA LINEA, premiere `world`, strategia "Cannes Court Métrage first, poi queue europea A-list"). Cinque voci di piano (`PlanEntry`) risultano create. Tutti gli altri 6 film restano in status `onboarding` senza piano e senza materiali.

### Film Senza Piano (6)
| Film | Regista | Anno | Status |
|------|---------|------|--------|
| La casa di Barbi | Gaia Bencivenga | 2024 | onboarding |
| Hold on | David Barbieri | 2024 | onboarding |
| ALLA SVIZZERA | Domenico Pizzulo | 2024 | onboarding |
| LA BUONA CONDOTTA | Francesco Gheghi | 2024 | onboarding |
| L'Incredibile Storia di Paolo Riva | Andrea Rampini | 2024 | onboarding |
| LA TRUFFA | Matteo Stipa | 2024 | onboarding |

### Risultati Recenti (ultimi 7 giorni)
Nessuna accettazione/rifiuto nuovo registrato. Nessun aggiornamento su submission esistenti.

### Azioni Pianificate
1. **Decidere entro lunedì (20/04) se spedire FEDELI ALLA LINEA al Locarno Pardi di domani** — deadline late giovedì 23/04, fee 130 USD. Il piano di distribuzione prevede premiere world: se Cannes Court Métrage è già stata tentata/persa, Locarno è il miglior fallback A-list europeo; altrimenti saltare per non bruciare la premiere.
2. Avviare onboarding materiali per i 6 film senza piano (vedi reparto QA).
3. Creare piani di distribuzione draft per almeno 2 degli onboarding (candidati prioritari: "LA BUONA CONDOTTA" per profilo autoriale, "L'Incredibile Storia di Paolo Riva" per potenziale in comedy circuits).
4. Preparare short-list di submission per la finestra 30/04-01/05 (Curtas Vila do Conde, Berlin Short, Uppsala, Concorto) non appena il piano FEDELI ALLA LINEA è confermato.

---

## 3. REPARTO DEVELOPMENT & OPS

### Situazione
Stack Next.js 14 + Prisma + SQLite, codice organizzato per reparti (src/app/api con cartelle `ai`, `auth`, `calendar`, `cron`, `distribution-plans`, `festival-editions`, `festival-masters`, `festivals`, `films`, `finance`, `import`, `persons`, `profile`, `settings`, `submissions`, `tasks`, `team`, `waiver-requests`).

**TypeScript check:** ✅ `npx tsc --noEmit` termina con exit 0, zero errori.
**Build artifacts:** cartella `.next` presente e aggiornata (ultimo build 17/04).

### Problemi Trovati
- `npm outdated` non è eseguibile in questo ambiente: il registry nega `@anthropic-ai/sdk` (403 Forbidden). Il controllo dipendenze va rilanciato dal terminale locale di Simone, non può essere automatizzato da questo ambiente.
- Nessuna task di DevOps tracciata nel DB — il reparto lavora "senza backlog" e lo fa sembrare più silenzioso di quanto probabilmente sia.

### Azioni Pianificate
1. Eseguire manualmente `npm outdated && npm audit` sulla macchina di sviluppo e aprire task in DB per ogni major/minor rilevato.
2. Aggiungere allo script CRON uno `tsc --noEmit` su ogni push per catturare regressioni (oggi nessun file `.github/workflows` è riferito nel DEPLOY.md — da confermare).
3. Valutare il passaggio da SQLite a Postgres su Railway prima di superare i 10k record edizione (siamo a 551, ma lo scaling previsto del job di AI refresh può gonfiare il dataset rapidamente).

---

## 4. REPARTO AI & STRATEGY

### Situazione
Esiste la route `src/app/api/ai` ma nessuna metrica di utilizzo è persistita in DB (no tabella `AiCall`, no log costi). L'unico output AI tracciabile è il campo `aiAnalysis` del singolo `DistributionPlan` esistente, contenente una nota manuale-seed ("Premiere Oscar-qualifying: Cannes Court Métrage come first choice, poi queue europea A-list"). I campi `needsAiRefresh=1` su 1.053 master suggeriscono che esiste un job di enrichment, ma i risultati (538 `ai_enriched`, 448 `ai_verified`) non sono confrontabili con un ground truth: serve un sample di controllo umano.

### Miglioramenti Suggeriti
1. **Costi & osservabilità:** introdurre una tabella `AiCall(endpoint, tokens_in, tokens_out, cost_usd, latency_ms)` e loggare ogni chiamata. Senza questo non si può mai rispondere alla domanda "quanto costa al giorno il refresh dei festival?".
2. **Qualità prompt:** lo scarto tra `ai_enriched` (538) e `ai_verified` (448) dice che ~17% delle enrichment non passano la verifica AI di secondo passaggio. Serve un eval set di 30-50 festival gold-standard per misurare precisione dei prompt di enrichment.
3. **Strategia submission:** il piano di distribuzione attuale è testo libero. Un endpoint che produca una queue ordinata (festival, finestra, fee, probabilità di accettazione, premiere rules) vincolata a schema JSON ridurrebbe ambiguità.

### Azioni Pianificate
1. Aprire PR per tabella `AiCall` + middleware di logging.
2. Generare eval set da 50 festival (bilanciato fra verified / unverified / A-list / locali) da usare come benchmark ricorrente.

---

## 5. REPARTO FINANCE & ADMINISTRATION

### Situazione
**La tabella `FinanceEntry` è vuota.** Zero spese, zero entrate, zero budget tracciati. Considerando che esiste almeno una submission attiva (Clermont-Ferrand) e che la short-list imminente include fee Locarno (130 USD) e 5 submission a ~€20 ciascuna, questo è incoerente con l'operatività reale: o le spese vengono tracciate altrove (contabilità esterna), oppure il reparto è scoperto.

### Dettaglio per Categoria
Nessun dato. Breakdown non producibile.

### Azioni Pianificate
1. Importare (anche manualmente) le spese sostenute per la submission Clermont-Ferrand e per eventuali altre fee già pagate, così il baseline è ≥ 0 e il ROI per film diventa misurabile.
2. Creare template di categorie standard: `submission_fee`, `screener_production`, `travel`, `dcp_creation`, `marketing`, `prize_income`, `screening_fee_income`, `grant`.
3. Allocare un budget submission per Q2 2026 (stima preliminare: 10 submission × €25 medio × 7 film = ~€1.750) e confermarlo con Simone.

---

## 6. REPARTO QA & DATA QUALITY

### Situazione
**Criticità materiali: totale.** Tutti e 7 i film hanno 10/10 materiali in stato `missing` (60 record con `status=missing` e `isRequired=1` considerando solo i required). I tipi mancanti uniformi per ciascun film sono: `screener_link`, `poster`, `trailer`, `tech_sheet`, `subtitles_en`, `bio_director`. In pratica il sistema segnala che nessun film è pronto all'invio, inclusa FEDELI ALLA LINEA che però risulta già submitted a Clermont-Ferrand: **incoerenza da investigare** (o la submission è stata fatta senza che i materiali siano stati flaggati come `ready`, o la tabella `FilmMaterial` non viene aggiornata dal flusso di submission).

### Problemi Trovati
- 60 material required con `status=missing` (su 70 record totali, 10 per film × 7 film).
- Film FEDELI ALLA LINEA: submission `submitted` ma zero materiali `ready` → inconsistenza.
- 1.347 FestivalMaster senza `contactEmailInfo` (74%).
- 503 FestivalEdition senza `activeDeadlineDate`.
- Probabili duplicati festival (Concorto, Lenola, Leeds — già citati in §1).
- 148 FestivalMaster senza `website`.
- Person e DistributionContract: tabelle completamente vuote, ma lo schema le richiede per relazioni strette con Film — da verificare se il flusso di onboarding le popola.

### Task QA Aperte
Nessuna task in `Task` con `status != 'done'`. Il reparto è in silenzio radio totale: o tutto è chiuso, o nessuno sta aprendo ticket. Dato lo stato del dataset, propendo per la seconda.

### Azioni Pianificate
1. Verificare perché la submission FEDELI ALLA LINEA è in `submitted` mentre `FilmMaterial` è tutto `missing` — se è un bug del flusso, va fixato oggi; se è intenzionale, introdurre un flag `materialChecklistComplete` coerente.
2. Partire dai 2 film "attivi" (FEDELI ALLA LINEA + il prossimo candidato alla distribuzione) e portare a `ready` almeno `screener_link`, `poster` e `trailer` entro la fine della settimana.
3. Job di migrazione che setti `activeDeadlineDate` a partire da `deadlineEarly/General/Late/Final` quando null.
4. Aprire 3 task QA ricorrenti settimanali: "verifica 50 festival unverified", "verifica 50 contatti mancanti", "controllo duplicati su batch di 200".

---

## DECISIONI IN ATTESA DI APPROVAZIONE

1. **Locarno – Pardi di domani per FEDELI ALLA LINEA (deadline giovedì 23/04, 130 USD, late).** — Il piano di distribuzione indica premiere world, con Cannes Court Métrage come first choice. Se Cannes è già stata tentata/persa, Locarno è il prossimo A-list europeo coerente con la strategia. **Raccomandazione DG: procedere solo se Cannes è definitivamente fuori; altrimenti passare (Locarno scotterebbe la world premiere in Svizzera)**.
2. **Batch AI refresh sui 1.053 festival con `needsAiRefresh=1`.** Costo stimato non misurabile finché non introduciamo logging AiCall. **Raccomandazione DG: partire con un canary da 50 festival (stimati < $5), misurare costo e qualità, e solo poi lanciare il batch completo.**
3. **Budget submission Q2 2026** — proposta: ~€1.750. **Raccomandazione DG: approvare e aprire prima riga in FinanceEntry già oggi.**
4. **Priorità onboarding materiali film 2024** — 6 film senza nemmeno poster/trailer/screener. **Raccomandazione DG: chiedere entro mercoledì 22/04 a registi/produttori di caricare almeno il triplo minimo (screener + poster + trailer) per i 2 titoli con maggior potenziale festival (LA BUONA CONDOTTA e L'Incredibile Storia di Paolo Riva).**

---

## PRIORITA' DEL GIORNO

1. **[QA + DISTRIBUZIONE]** Risolvere l'incoerenza FEDELI ALLA LINEA `submitted` vs materiali `missing`. Fino a quando questa ambiguità c'è, nessun report di distribuzione è affidabile.
2. **[SCOUTING]** Lanciare il job di normalizzazione `activeDeadlineDate` sulle 503 edizioni scoperte — senza questo fix il reparto Distribuzione è cieco oltre i 48 festival oggi pianificabili.
3. **[DISTRIBUZIONE]** Decisione Locarno (SI/NO) entro lunedì 20/04 per lasciare due giorni lavorativi al processo di submission prima del 23/04.

---

*Report generato automaticamente sabato 18 aprile 2026 — Prossimo report domani.*
