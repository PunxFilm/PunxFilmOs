---
name: punxfilm-festival-manager
description: "Gestisci festival ed edizioni in PunxFilm OS: cerca festival online, importa nuovi festival, aggiorna dati, crea edizioni, monitora scadenze e status. Usa questa skill ogni volta che l'utente parla di festival, edizioni, deadline, aggiornare dati festival, creare nuova edizione, importare festival, cercare festival, rollover annuale, controllare scadenze, o gestire il database dei festival."
---

# PunxFilm Festival Manager

Skill per la gestione completa dei festival nel database PunxFilm OS: verifica dati, aggiornamento, ricerca online, import, creazione edizioni e monitoraggio.

## Contesto App

PunxFilm OS e' un'app Next.js 14 con Prisma + SQLite per la distribuzione di cortometraggi nei festival.
- **Root progetto:** `/Users/punxfilm/Documents/VisualStudioCode/punxfilm-os`
- **Database:** `dev.db` nella root del progetto
- **Base URL API:** `http://localhost:3000` (dev server Next.js)

## Schema Database

Il database usa due modelli Prisma separati (NON una tabella flat):

### FestivalMaster — Anagrafica permanente del festival

| Campo | Tipo | Note |
|-------|------|------|
| `id` | String (CUID) | PK auto-generato |
| `base44Id` | String? | ID originale Base44 per sync |
| `name` | String | Nome ufficiale (obbligatorio) |
| `canonicalName` | String? | Nome normalizzato per dedup |
| `country` | String | Paese (obbligatorio) |
| `region` | String? | Regione |
| `city` | String | Citta' (obbligatorio) |
| `website` | String? | URL sito ufficiale |
| `instagram` | String? | Handle Instagram |
| **Classificazione** | | |
| `classification` | String? | international, national, regional, local, competitive, non-competitive |
| `type` | String? | short, mixed, documentary, feature, animation, genre |
| `focus` | String? | Specializzazione tematica |
| **Requisiti film** | | |
| `maxMinutes` | Int? | Durata massima accettata |
| `acceptedGenres` | String? | Generi (comma-separated) |
| `acceptedThemes` | String? | Temi (comma-separated) |
| `acceptsFirstWork` | Boolean | Default: false |
| `directorRequirements` | String? | Requisiti regista |
| `regulationsUrl` | String? | URL regolamento |
| **Qualita' e qualifying** | | |
| `punxRating` | Int? | 1-5 rating manuale PunxFilm |
| `qualityScore` | Int? | 1-100 AI score |
| `academyQualifying` | Boolean | Oscar-qualifying (default: false) |
| `baftaQualifying` | Boolean | BAFTA-qualifying (default: false) |
| `canadianScreenQualifying` | Boolean | Canadian Screen (default: false) |
| `goyaQualifying` | Boolean | Goya-qualifying (default: false) |
| `efaQualifying` | Boolean | EFA-qualifying (default: false) |
| `shortFilmConferenceMember` | Boolean | Default: false |
| `qualifying` | String? | Dettagli qualifying (testo/JSON) |
| **Proiezione** | | |
| `screeningType` | String? | online, in_person, hybrid |
| `screeningLocation` | String? | Sede/location |
| `screeningQuality` | String? | Specifiche qualita' |
| `dcp` | Boolean | Supporto DCP (default: false) |
| **Industry** | | |
| `industry` | Boolean | Default: false |
| `maxYearsProduction` | Int? | Eta' massima produzione |
| `travelSupport` | String? | Supporto viaggio |
| `hospitalitySupport` | String? | Supporto ospitalita' |
| **Contatti** | | |
| `contactName` | String? | Nome contatto |
| `contactRole` | String? | Ruolo contatto |
| `contactTelephone` | String? | Telefono |
| `contactEmailDirector` | String? | Email submission |
| `contactEmailInfo` | String? | Email info generale |
| `contactEmailTechnical` | String? | Email tecnica |
| **Note interne** | | |
| `internalNotes` | String? | Note interne PunxFilm |
| `punxHistory` | String? | Storico relazione PunxFilm |
| **Waiver** | | |
| `waiverType` | String | none, code, agreement, request_pending (default: "none") |
| `waiverDetails` | String? | Info waiver |
| **Submission** | | |
| `submissionUrlBase` | String? | URL base per submission |
| `submissionPlatform` | String? | filmfreeway, festhome, shortfilmdepot, direct, altro |
| **Verifica e QA** | | |
| `isActive` | Boolean | Attivo (default: true) |
| `isMergedDuplicate` | Boolean | Duplicato mergiato (default: false) |
| `mergedIntoFestivalId` | String? | ID master in cui e' stato mergiato |
| `lastVerifiedAt` | DateTime? | Ultima verifica |
| `verificationStatus` | String | **unverified**, verified, needs_review (default: "unverified") |
| `needsAiRefresh` | Boolean | Necessita refresh AI (default: false) |
| `verificationNotes` | String? | Note verifica |
| `dataConfidenceScore` | Float? | 0-100 confidenza dati |
| `sourceLastChecked` | String? | URL fonte controllata |
| `sourceLastCheckedAt` | DateTime? | Quando fonte controllata |
| `sourceNotes` | String? | Note sulla fonte |
| `foundedYear` | Int? | Anno fondazione |
| `openingDate` | String? | Periodo tipico apertura iscrizioni |

### FestivalEdition — Dati annuali per ogni edizione

| Campo | Tipo | Note |
|-------|------|------|
| `id` | String (CUID) | PK auto-generato |
| `festivalMasterId` | String | FK a FestivalMaster (obbligatorio) |
| `festivalName` | String? | Nome denormalizzato per display |
| `year` | Int | Anno edizione (obbligatorio) |
| `editionNumber` | Int? | Numero edizione |
| **Lifecycle** | | |
| `lifecycleStatus` | String? | draft, scouting, submission_open, submission_closed, selection, event, completed |
| `isLocked` | Boolean | Blocca modifiche (default: false) |
| **Deadline** | | |
| `openingDate` | DateTime? | Apertura iscrizioni |
| `deadlineEarly` | DateTime? | Early bird |
| `deadlineGeneral` | DateTime? | Deadline regolare |
| `deadlineLate` | DateTime? | Late deadline |
| `deadlineFinal` | DateTime? | Deadline finale |
| `deadlineRaw` | String? | Testo originale |
| **Date evento** | | |
| `notificationDate` | DateTime? | Data notifica risultati |
| `eventStartDate` | DateTime? | Inizio evento |
| `eventEndDate` | DateTime? | Fine evento |
| **Fee** | | |
| `feeAmount` | Float? | Fee regolare |
| `feeLateFee` | Float? | Fee late |
| `feeCurrency` | String | Default: "USD" |
| `screeningFee` | Float? | Fee proiezione |
| **Premi** | | |
| `prizeCash` | Float? | Premio in denaro |
| `prizeDescription` | String? | Descrizione premi |
| **Regole** | | |
| `premiereRules` | String? | Regole premiere |
| `durationRules` | String? | Regole durata |
| `categoryRules` | String? | Regole categorie |
| **Waiver** | | |
| `waiverPolicy` | String? | non_dichiarata, no_waiver, waiver_disponibile, waiver_ottenuto |
| `waiverCode` | String? | Codice waiver |
| `waiverNotes` | String? | Note waiver |
| **Verifica** | | |
| `verificationStatus` | String | unverified, verified (default: "unverified") |
| `lastVerifiedDate` | DateTime? | Ultima verifica |
| `needsReview` | Boolean | Default: false |

**Vincolo unico:** Un solo record per combinazione `festivalMasterId + year`.

## API REST

**IMPORTANTE:** Tutte le operazioni sul database devono passare dalle API REST dell'app. NON usare accesso diretto al DB con sqlite3 o Python.

### Festival Masters

**Lista/Cerca:**
```
GET /api/festival-masters?search=clermont&classification=international&verificationStatus=unverified&limit=50&offset=0
→ { festivals: [...], total: number }
```
Parametri query: `search`, `classification`, `type`, `country`, `verificationStatus`, `limit` (default 100), `offset` (default 0).
Ogni festival include `completenessScore` (0-100) e ultima edizione.

**Dettaglio:**
```
GET /api/festival-masters/{id}
→ { id, name, ..., editions: [...], planEntries: [...], _count: {...} }
```

**Crea nuovo:**
```
POST /api/festival-masters
Body: { name: "...", country: "...", city: "...", ...altri campi opzionali }
→ 201 { id, name, ... }
```
Campi obbligatori: `name`, `country`, `city`.

**Aggiorna:**
```
PUT /api/festival-masters/{id}
Body: { verificationStatus: "verified", lastVerifiedAt: "2026-04-14T...", website: "https://...", ... }
→ { id, name, ... }
```
Accetta qualsiasi campo del modello FestivalMaster.

**Elimina:**
```
DELETE /api/festival-masters/{id}
→ { ok: true }
```

### Festival Editions

**Lista edizioni di un master:**
```
GET /api/festival-masters/{masterId}/editions
→ [{ id, year, deadlineGeneral, ... }, ...]
```

**Crea edizione:**
```
POST /api/festival-masters/{masterId}/editions
Body: { year: 2026, deadlineGeneral: "2026-06-01T00:00:00Z", feeAmount: 25, ... }
→ 201 { id, year, ... }
```
Campo obbligatorio: `year`. Le date devono essere ISO 8601.

**Aggiorna edizione:**
```
PUT /api/festival-editions/{editionId}
Body: { deadlineGeneral: "2026-07-01T00:00:00Z", feeAmount: 30, ... }
→ { id, year, ... }
```

**Elimina edizione:**
```
DELETE /api/festival-editions/{editionId}
→ { ok: true }
```

## OPERAZIONI — Ordine di Priorita'

### OP 1 — VERIFICA FESTIVAL ESISTENTI (PRIORITA' MASSIMA)

**Obiettivo:** Verificare i ~1762 festival con `verificationStatus: "unverified"` nel database. Questa e' la priorita' numero uno prima di qualsiasi altra operazione.

**Ordine di verifica:**
1. Festival qualifying (academy, BAFTA, EFA, Goya, Canadian Screen) — PRIMA
2. Festival con `qualityScore` > 70 o `punxRating` >= 4
3. Festival internazionali (`classification: "international"`)
4. Festival nazionali, poi regionali, poi il resto

**Procedura per ogni batch (10-20 festival):**

1. **Recupera festival da verificare:**
   ```
   GET /api/festival-masters?verificationStatus=unverified&limit=20
   ```

2. **Per ogni festival, cerca online:**
   - WebSearch: `"[nome festival] [citta'] [paese] official website short film"`
   - WebSearch: `"[nome festival] filmfreeway"` oppure `"[nome festival] festhome"`
   - Se ha `website`: WebFetch del sito ufficiale per estrarre dati

3. **Verifica e arricchisci dati:**
   - Nome ufficiale corretto
   - Paese e citta' corretti
   - Sito web funzionante
   - Classificazione (international/national/regional)
   - Tipo (short/mixed/documentary/genre)
   - Qualifying status (Oscar, BAFTA, EFA, Goya — verifica sulle liste ufficiali)
   - Contatti (email, nome programmatore)
   - Piattaforma submission (filmfreeway, festhome, shortfilmdepot, direct)
   - URL submission
   - Tipo proiezione (in_person, hybrid, online)
   - Se accettano corti e durata massima
   - Anno fondazione se disponibile

4. **Aggiorna il festival:**
   ```
   PUT /api/festival-masters/{id}
   Body: {
     verificationStatus: "verified",
     lastVerifiedAt: "2026-04-14T10:00:00Z",
     dataConfidenceScore: 85,
     verificationNotes: "Verificato da sito ufficiale. Edizione 2026 confermata.",
     // + tutti i campi arricchiti
   }
   ```

5. **Se il festival NON esiste piu' o non e' trovabile online:**
   ```
   PUT /api/festival-masters/{id}
   Body: {
     verificationStatus: "needs_review",
     isActive: false,
     verificationNotes: "Non trovato online. Possibile festival chiuso o rinominato."
   }
   ```

6. **Se il festival e' un duplicato** di un altro gia' verificato:
   ```
   PUT /api/festival-masters/{id}
   Body: {
     isMergedDuplicate: true,
     mergedIntoFestivalId: "[id del master corretto]",
     isActive: false,
     verificationNotes: "Duplicato di [nome festival]. Mergiato."
   }
   ```

**Report finale:** Genera un report markdown in `reports/festival-verification-YYYY-MM-DD.md` con:
- Totale festival verificati in questa sessione
- Festival aggiornati con nuovi dati
- Festival disattivati (non trovati)
- Festival duplicati mergiati
- Completeness score medio prima/dopo

### OP 2 — AGGIORNARE FESTIVAL E EDIZIONI

Dopo la verifica, aggiorna i dati delle edizioni correnti (2026/2027):

1. **Per ogni festival verificato senza edizione per l'anno corrente:**
   - Cerca online date, deadline, fee della prossima edizione
   - Crea edizione:
     ```
     POST /api/festival-masters/{id}/editions
     Body: { year: 2026, deadlineGeneral: "...", feeAmount: ..., eventStartDate: "...", ... }
     ```

2. **Per edizioni esistenti con dati incompleti:**
   - Cerca online i dati mancanti
   - Aggiorna:
     ```
     PUT /api/festival-editions/{editionId}
     Body: { deadlineGeneral: "...", feeAmount: ..., premiereRules: "...", ... }
     ```

3. **Merge intelligente:** Non sovrascrivere mai dati che sembrano inseriti manualmente (es. `waiverCode`, `internalNotes`). Aggiorna solo campi vuoti o con dati palesemente obsoleti.

### OP 3 — CREARE EDIZIONI NUOVO ANNO

Quando l'utente chiede il rollover annuale (es. "crea edizioni 2027"):

1. Trova tutti i master attivi senza edizione per l'anno target
2. Per ognuno cerca online le date della nuova edizione
3. Crea l'edizione via API con dati trovati
4. Se non trovi date specifiche, crea edizione draft: `{ year: 2027, lifecycleStatus: "scouting" }`

### OP 4 — CERCARE E IMPORTARE NUOVI FESTIVAL

**IMPORTANTE:** Questa operazione ha priorita' INFERIORE alla verifica dei festival esistenti. Eseguila solo quando la verifica e' a buon punto (>50% verificati).

**Strategia di ricerca:**
1. WebSearch per cercare su FilmFreeway, Festhome, ShortFilmDepot e Google
2. WebFetch per visitare siti ufficiali

**Query di ricerca:**
- `"short film festival 2026 submissions open in-person [regione/paese]"`
- `"festival cortometraggi 2026 iscrizioni aperte"`
- `"filmfreeway short film festival [paese]"`

**Criteri di INCLUSIONE (tutti obbligatori):**
- Proiezione fisica (in-person o hybrid) — ESCLUDI festival solo online
- Accettano cortometraggi
- Hanno un sito web verificabile
- Sono attivi (edizioni recenti)

**Verifica duplicati PRIMA dell'import:**
```
GET /api/festival-masters?search=[nome festival]&limit=10
```
Se c'e' un match con nome simile + stesso paese, e' probabilmente un duplicato. NON importare.

**Import:**
```
POST /api/festival-masters
Body: {
  name: "Nome Festival",
  country: "IT",
  city: "Roma",
  classification: "international",
  type: "short",
  website: "https://...",
  screeningType: "in_person",
  verificationStatus: "verified",
  lastVerifiedAt: "2026-04-14T10:00:00Z",
  dataConfidenceScore: 90,
  submissionPlatform: "filmfreeway",
  // ...tutti i dati trovati
}
```

### OP 5 — MONITORARE SCADENZE

Query festival con deadline nei prossimi 30/60/90 giorni:

```
GET /api/festival-masters?verificationStatus=verified&limit=500
```

Poi filtra lato client le edizioni con deadline imminenti. Genera report `reports/deadline-report-YYYY-MM-DD.md` con:
- Festival con deadline entro 7 giorni (URGENTE)
- Festival con deadline entro 30 giorni
- Festival con deadline entro 60 giorni
- Per ognuno: nome, citta', deadline, fee, piattaforma submission

### OP 6 — STATISTICHE E REPORT

Genera report con KPI del database festival:

```
GET /api/festival-masters?limit=1&offset=0
→ usa il campo "total" per il conteggio totale

GET /api/festival-masters?verificationStatus=verified&limit=1
→ totale verificati

GET /api/festival-masters?verificationStatus=unverified&limit=1
→ totale non verificati
```

Report `reports/festival-stats-YYYY-MM-DD.md`:
- Totale festival nel DB
- Verificati vs non verificati (%)
- Breakdown per classificazione
- Breakdown per paese (top 20)
- Qualifying: quanti Oscar, BAFTA, EFA, Goya
- Completeness score medio
- Festival attivi vs disattivati
- Edizioni per anno

## Sistema di Completeness

L'app ha un sistema di scoring della completezza dei dati in `src/lib/completeness.ts`.

**Gruppi FestivalMaster con pesi:**
| Gruppo | Peso | Campi |
|--------|------|-------|
| Identita' | 3 | name, country, city |
| Classificazione | 2 | classification, type |
| Web & Piattaforma | 2 | website, submissionUrlBase, submissionPlatform (almeno 1) |
| Contatti | 2 | contactEmailInfo, contactEmailDirector, contactEmailTechnical, contactName (almeno 1) |
| Requisiti Film | 1.5 | maxMinutes, acceptedGenres, acceptedThemes, focus |
| Qualificazioni | 1 | qualityScore, punxRating |
| Proiezione | 1 | screeningType, dcp |
| Supporto | 0.5 | travelSupport, hospitalitySupport |
| Verifica | 1 | verificationStatus != "unverified" |

**Target:** Portare la completeness media di tutti i festival verificati sopra il 70%.

L'API `GET /api/festival-masters` ritorna gia' il `completenessScore` per ogni festival.

## Classificazione Festival (Guida)

- **A-list / international:** Festival qualifying per Oscar, BAFTA, EFA, Goya, Canadian Screen Awards. Es: Clermont-Ferrand, Tampere, Oberhausen, Palm Springs ShortFest
- **B-list / national:** Festival internazionali importanti ma non qualifying. Buona visibilita' e networking
- **Niche:** Festival specializzati per genere (horror, animazione, documentario) o tematica
- **Regional:** Festival locali o nazionali, utili per premiere nazionali

## Precauzioni

- **API, non DB diretto:** Tutte le operazioni via API REST, mai sqlite3 o Python
- **Non inventare MAI dati:** Se un dato non e' verificabile online, lasciarlo null/vuoto
- **Conferma per operazioni massive:** Chiedi conferma per batch > 20 festival
- **Priorita':** Verifica esistenti > Aggiornamento > Import nuovi
- **Duplicati:** Controlla SEMPRE se un festival esiste gia' prima di importare
- **Date ISO 8601:** Tutte le date devono essere in formato `"2026-06-01T00:00:00.000Z"`
- **Conservativo nella classificazione:** Se non sei sicuro che sia qualifying, NON segnarlo come tale
- **Preserva dati manuali:** Non sovrascrivere campi come `internalNotes`, `punxHistory`, `waiverCode` con dati trovati online
