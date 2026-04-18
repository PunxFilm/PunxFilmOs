# PunxFilm OS — Report Mattutino
**Data:** 15 Aprile 2026 | **Giorno:** Mercoledì
**Generato da:** Direttore Generale AI

---

## DASHBOARD RAPIDO

| Metrica | Valore | Note |
|---------|--------|------|
| Film in database | 7 | 6 in onboarding, 1 in distribuzione |
| Festival Master | 1.805 | 228 Academy Qualifying |
| Edizioni Festival | 370 | 2 con submission aperte |
| Submission totali | 0 | Nessuna submission registrata |
| Piani distribuzione | 0 | Nessun piano creato |
| Task aperte | 0 | Nessuna task registrata |
| Spese totali | €0 | Nessuna entry finanziaria |
| Entrate totali | €0 | Nessuna entry finanziaria |

---

## 1. REPARTO SCOUTING & FESTIVAL

### Situazione
Il database conta 1.805 Festival Master e 370 Edizioni Festival. La qualità dei dati è un punto critico: solo 44 festival master (2,4%) risultano verificati manualmente, mentre 672 (37%) sono ancora "unverified". Sul fronte AI, 579 risultano "ai_enriched" e 448 "ai_verified". Per le edizioni, 270 su 370 (73%) sono in stato "da_verificare".

Nessuna edizione ha attualmente una deadline impostata nei prossimi 30 giorni — tutte le 370 edizioni risultano senza `activeDeadlineDate` valorizzata. Questo è un problema grave: significa che il sistema non sta tracciando le scadenze di submission.

### Deadline Imminenti (7 giorni)
Nessuna deadline registrata nei prossimi 7 giorni.

### Prossime Scadenze (8-14 giorni)
Nessuna deadline registrata.

### Lifecycle Edizioni
- 225 edizioni senza lifecycle status (NULL)
- 143 in stato "draft"
- 2 con "submission_open"

### Azioni Pianificate
1. **URGENTE:** Popolare le `activeDeadlineDate` per tutte le edizioni con deadline note — senza questo dato il sistema è cieco sulle scadenze
2. Verificare le 2 edizioni con status "submission_open" e assicurarsi che le relative deadline siano tracciate
3. Avviare un ciclo di verifica sulle 270 edizioni "da_verificare"
4. Ridurre il numero di festival master "unverified" (672) con sessioni di AI refresh

---

## 2. REPARTO DISTRIBUZIONE & SUBMISSION

### Situazione
Situazione critica: **zero submission registrate nel sistema** e **zero piani di distribuzione creati**. Tutti e 7 i film sono privi di piano di distribuzione. Un film ("FEDELI ALLA LINEA") è già in stato `in_distribuzione` ma non ha né piano né submission.

### Film nel Catalogo

| # | Titolo | Regista | Durata | Genere | Status |
|---|--------|---------|--------|--------|--------|
| 1 | La casa di Barbi | Gaia Bencivenga | 11'40" | Coming of age | onboarding |
| 2 | Hold on | David Barbieri | 4'00" | Comedy | onboarding |
| 3 | FEDELI ALLA LINEA | Salvatore Martusciello | 15'00" | Grottesco | in_distribuzione |
| 4 | ALLA SVIZZERA | Domenico Pizzulo | 17'00" | Commedia/Drammatico | onboarding |
| 5 | LA BUONA CONDOTTA | Francesco Gheghi | 14'00" | Commedia nera | onboarding |
| 6 | L'Incredibile Storia di Paolo Riva | Andrea Rampini | 19'00" | Tragicommedia | onboarding |
| 7 | LA TRUFFA | Matteo Stipa | 9'00" | Commedia | onboarding |

### Film Senza Piano di Distribuzione
Tutti e 7 i film sono privi di piano di distribuzione.

### Risultati Recenti
Nessun risultato negli ultimi 7 giorni (nessuna submission presente nel sistema).

### Azioni Pianificate
1. **PRIORITÀ ASSOLUTA:** Creare il piano di distribuzione per "FEDELI ALLA LINEA" che è già in fase di distribuzione attiva
2. Completare l'onboarding dei 6 film rimanenti (verificare materiali, screener link, poster)
3. Definire la strategia di submission per ciascun film in base a genere, durata e premiere status

---

## 3. REPARTO DEV OPS

### Situazione
Il progetto Next.js 14 + Prisma presenta problemi di tipo TypeScript significativi. La build potrebbe non completarsi correttamente.

### Problemi Trovati
**48 errori TypeScript** rilevati, concentrati principalmente in:

1. **`src/app/api/festivals/[id]/route.ts`** — Riferimenti a `prisma.festival` che non esiste più nello schema (probabilmente rinominato in `festivalMaster` o `festivalEdition`). 3 errori.
2. **`src/app/api/festivals/route.ts`** — Stesso problema di sopra. 2 errori.
3. **`src/app/api/seed/route.ts`** — Multipli errori: riferimenti a `prisma.festival`, proprietà `title` non esistente in `FilmCreateInput`, proprietà `festivalId` non esistente in `PlanEntryCreateInput` e `SubmissionCreateInput`. ~30+ errori.
4. **`src/app/api/submissions/route.ts`** — Tipo `waiverApplied` incompatibile (`boolean | null` vs `boolean`).
5. **`src/app/layout.tsx`** — Import CSS non trovato.

### Dipendenze
Il progetto ha 15 dipendenze di produzione e 1 di sviluppo.

### Azioni Pianificate
1. **URGENTE:** Aggiornare le API route `festivals/` per usare i modelli Prisma corretti (`festivalMaster`/`festivalEdition`)
2. Riscrivere `seed/route.ts` per allinearsi allo schema Prisma attuale
3. Fixare il tipo nullable di `waiverApplied` in `submissions/route.ts`
4. Verificare l'import CSS in `layout.tsx`

---

## 4. REPARTO AI & STRATEGY

### Situazione
L'infrastruttura AI ha completato l'arricchimento di 579 festival master e la verifica AI di 448. Rimangono 672 festival non verificati e 61 in revisione.

### Performance AI Enrichment

| Status | Festival Master | % |
|--------|----------------|---|
| ai_enriched | 579 | 32% |
| ai_verified | 448 | 25% |
| in_review | 61 | 3% |
| needs_review | 1 | <1% |
| unverified | 672 | 37% |
| verified (manuale) | 44 | 2% |

### Miglioramenti Suggeriti
1. Prioritizzare il refresh AI sui 672 festival "unverified", partendo dai festival Academy Qualifying (228 totali)
2. Implementare un sistema automatico di deadline tracking che popoli `activeDeadlineDate` dalle fonti web
3. Creare un endpoint AI per il matching film-festival basato su genere, durata e requisiti

### Azioni Pianificate
1. Lanciare batch AI refresh sui festival unverified con focus su quelli internazionali (751 festival)
2. Validare la qualità dei dati AI-enriched con spot-check manuali

---

## 5. REPARTO FINANCE

### Situazione
**Nessuna entry finanziaria presente nel sistema.** Il modulo finance è completamente vuoto — non ci sono registrazioni di spese, entrate, fee di submission o budget.

### Dettaglio per Categoria
Nessun dato disponibile.

### Azioni Pianificate
1. Iniziare a registrare le fee di submission per ciascun festival (molte edizioni hanno campi `feeAmount` valorizzati)
2. Definire il budget di distribuzione per ciascun film
3. Registrare eventuali costi già sostenuti (fee piattaforme, materiali, traduzioni)

---

## 6. REPARTO QA & DATA QUALITY

### Situazione
La qualità dei dati è il principale punto debole del sistema. Diversi indicatori critici:

### Problemi Trovati

1. **Deadline non tracciate:** Tutte le 370 edizioni hanno `activeDeadlineDate` a NULL — il sistema non sta tracciando nessuna scadenza
2. **Lifecycle status mancante:** 225 edizioni (61%) senza lifecycle status
3. **Materiali film:** 0 materiali registrati nel sistema — nessun film ha materiali catalogati (poster, screener, DCP, sottotitoli)
4. **Persone:** 0 record nella tabella Person — i dati di registi e produttori sono solo embedded come JSON nei record Film
5. **Contratti:** 0 contratti di distribuzione registrati
6. **Film senza screener:** Nessun film ha un `screenerLink` valorizzato
7. **Film senza poster:** Nessun film ha un `posterUrl` valorizzato
8. **Edizioni non verificate:** 270 edizioni in stato "da_verificare" (73%)

### Task QA Aperte
Nessuna task formale registrata nel sistema.

### Azioni Pianificate
1. **CRITICO:** Popolare le `activeDeadlineDate` per le edizioni festival
2. Richiedere ai filmmaker screener link e poster per tutti i 7 film
3. Creare i record Person per registi e produttori a partire dai dati JSON embedded
4. Impostare task formali nel sistema per tracciare il lavoro QA

---

## DECISIONI IN ATTESA DI APPROVAZIONE

1. **Piano distribuzione "FEDELI ALLA LINEA"** — Il film è in stato `in_distribuzione` ma non ha piano né submission. Raccomandazione DG: creare immediatamente il piano di distribuzione concentrandosi su festival internazionali di genere e festival italiani A-list. Serve approvazione di Simone sulla strategia.

2. **Priorità onboarding film** — 6 film sono in fase di onboarding. Raccomandazione DG: stabilire un ordine di priorità basato su completezza materiali e deadline festival imminenti. Suggerisco di procedere con "LA BUONA CONDOTTA" (Gheghi) e "ALLA SVIZZERA" (Pizzulo) come prossimi, dato il loro potenziale nei festival europei.

3. **Fix tecnici vs. nuove feature** — Con 48 errori TypeScript, l'app ha debito tecnico significativo. Raccomandazione DG: dedicare una sessione di dev a risolvere gli errori prima di procedere con nuove funzionalità.

4. **Strategia verifica festival** — 672 festival master non verificati. Raccomandazione DG: concentrare gli sforzi di verifica sui ~228 festival Academy Qualifying e sui festival con deadline nel Q2 2026, piuttosto che procedere indistintamente.

---

## PRIORITÀ DEL GIORNO

1. **[DISTRIBUZIONE]** Creare il piano di distribuzione per "FEDELI ALLA LINEA" — è l'unico film in distribuzione attiva e sta operando alla cieca senza un piano formale
2. **[QA/SCOUTING]** Popolare le deadline delle edizioni festival — senza questo dato l'intero sistema di tracking scadenze è inutilizzabile
3. **[DEV OPS]** Risolvere i 48 errori TypeScript, partendo dalle API route `festivals/` e `seed/` che usano modelli Prisma obsoleti

---

*Report generato automaticamente alle 09:00 del 15/04/2026 — Prossimo report domani.*
