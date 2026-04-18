---
name: punxfilm-distribution-manager
description: "Gestisci distribuzione e submission in PunxFilm OS: crea piani distribuzione, gestisci submission ai festival, traccia risultati (accettazioni, premi, rifiuti), gestisci waiver code, monitora status pipeline. Usa questa skill quando l'utente parla di submission, distribuzione, piani, premiere, queue, waiver, candidature festival, risultati selezione, o gestione della pipeline di distribuzione dei cortometraggi."
---

# PunxFilm Distribution Manager

Skill per la gestione completa della distribuzione film e submission ai festival in PunxFilm OS.

## Contesto App

PunxFilm OS e' un'app Next.js 14 con Prisma + SQLite per la distribuzione di cortometraggi nei festival. Il database e' in `prisma/dev.db` alla root del progetto.

## Schema Database di Competenza

### Submission
```
Submission (
  id TEXT PRIMARY KEY,
  filmId TEXT NOT NULL → Film.id,
  festivalEditionId TEXT NOT NULL → FestivalEdition.id,
  status TEXT (draft|submitted|accepted|rejected|withdrawn),
  platform TEXT (filmfreeway|festhome|direct|other),
  submittedAt DATETIME,
  estimatedFee REAL,
  feesPaid REAL,
  waiverApplied BOOLEAN DEFAULT false,
  waiverCode TEXT,
  result TEXT (official_selection|competition|special_mention|award),
  notificationDate DATETIME,
  festivalEventDate DATETIME,
  prizeAmount REAL,
  notes TEXT
)
UNIQUE(filmId, festivalEditionId)
```

### DistributionPlan
```
DistributionPlan (
  id TEXT PRIMARY KEY,
  filmId TEXT NOT NULL → Film.id,
  premiereLevel TEXT (world|international|european|national),
  status TEXT (draft|active|completed|archived),
  materialChecklistComplete BOOLEAN DEFAULT false,
  aiAnalysis TEXT (JSON),
  createdAt, updatedAt
)
```

### PlanEntry
```
PlanEntry (
  id TEXT PRIMARY KEY,
  planId TEXT NOT NULL → DistributionPlan.id,
  festivalMasterId TEXT NOT NULL → FestivalMaster.id,
  festivalEditionId TEXT → FestivalEdition.id,
  role TEXT (premiere|queue),
  position INT (0=premiere, 1+=queue order),
  status TEXT (pending|approved|rejected|subscribed),
  priority TEXT (A|B|C),
  matchScore INT (0-100),
  matchReasoning TEXT,
  waiverApplied BOOLEAN,
  waiverCode TEXT,
  estimatedFee REAL,
  actualFee REAL,
  submissionId TEXT → Submission.id
)
UNIQUE(planId, festivalMasterId)
```

### DistributionContract
```
DistributionContract (
  id TEXT PRIMARY KEY,
  filmId TEXT → Film.id,
  distributorName TEXT,
  clientName TEXT,
  clientEmail TEXT,
  startDate DATETIME,
  endDate DATETIME,
  status TEXT (active|expired|terminated),
  notes TEXT
)
```

## OPERAZIONI DISPONIBILI

### 1. Creare un Piano di Distribuzione

**Workflow completo (4 step):**

1. **Seleziona Film** — Verifica che il film esista e abbia dati completi
2. **Analisi AI** — Chiama `/api/ai/analyze-film` per ottenere premiereLevel consigliato
3. **Seleziona Premiere** — Chiama `/api/ai/rank-festivals` per rankare festival per premiere
4. **Costruisci Queue** — Chiama `/api/ai/suggest-queue` per festival post-premiere
5. **Salva** — POST `/api/distribution-plans` con entries

```python
import sqlite3, json, uuid
from datetime import datetime

db_path = 'prisma/dev.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Verifica film
c.execute("SELECT id, titleOriginal, director, status FROM Film WHERE id = ?", (film_id,))
film = c.fetchone()

# Crea piano
plan_id = uuid.uuid4().hex[:25]
c.execute("""INSERT INTO DistributionPlan (id, filmId, premiereLevel, status, createdAt, updatedAt)
  VALUES (?, ?, ?, 'draft', ?, ?)""",
  (plan_id, film_id, premiere_level, datetime.now().isoformat(), datetime.now().isoformat()))

# Aggiungi premiere entry
entry_id = uuid.uuid4().hex[:25]
c.execute("""INSERT INTO PlanEntry (id, planId, festivalMasterId, role, position, status, priority, matchScore)
  VALUES (?, ?, ?, 'premiere', 0, 'pending', 'A', ?)""",
  (entry_id, plan_id, festival_master_id, match_score))

# Aggiungi queue entries
for i, fest in enumerate(queue_festivals):
    entry_id = uuid.uuid4().hex[:25]
    c.execute("""INSERT INTO PlanEntry (id, planId, festivalMasterId, role, position, status, priority, matchScore)
      VALUES (?, ?, ?, 'queue', ?, 'pending', ?, ?)""",
      (entry_id, plan_id, fest['id'], i+1, fest['priority'], fest['score']))

conn.commit()
conn.close()
```

### 2. Gestire Submission

**Creare una submission:**
```python
sub_id = uuid.uuid4().hex[:25]
c.execute("""INSERT INTO Submission 
  (id, filmId, festivalEditionId, status, platform, estimatedFee, waiverApplied, waiverCode, createdAt, updatedAt)
  VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)""",
  (sub_id, film_id, edition_id, platform, fee, waiver_applied, waiver_code, now, now))
```

**Aggiornare status submission:**
- `draft` → `submitted` (RICHIEDE APPROVAZIONE — conferma invio effettivo)
- `submitted` → `accepted` o `rejected` (autonomo, basato su notifica)
- Qualsiasi → `withdrawn` (RICHIEDE APPROVAZIONE)

**Collegare submission a PlanEntry:**
```python
c.execute("UPDATE PlanEntry SET submissionId = ?, status = 'subscribed' WHERE id = ?",
  (submission_id, plan_entry_id))
```

### 3. Monitorare Pipeline

```python
# Submission per film
c.execute("""SELECT s.*, fm.name as festivalName 
  FROM Submission s 
  JOIN FestivalEdition fe ON fe.id = s.festivalEditionId
  JOIN FestivalMaster fm ON fm.id = fe.festivalMasterId
  WHERE s.filmId = ? ORDER BY s.createdAt DESC""", (film_id,))

# Tasso accettazione
c.execute("""SELECT 
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN status IN ('accepted','rejected') THEN 1 END) as decided,
  COUNT(*) as total
  FROM Submission""")

# Film senza piano
c.execute("""SELECT f.id, f.titleOriginal FROM Film f
  LEFT JOIN DistributionPlan dp ON dp.filmId = f.id
  WHERE dp.id IS NULL AND f.status IN ('active','in_distribuzione')""")
```

### 4. Tracciare Risultati

Quando arriva un risultato (accettazione, premio, rifiuto):
1. Aggiorna `Submission.status` e `Submission.result`
2. Se premio: aggiorna `Submission.prizeAmount`
3. Notifica Reparto Finance per registrare entrata
4. Notifica Reparto AI per feedback loop sul ranking
5. Aggiorna `PlanEntry.status` di conseguenza

## Decisioni Autonome vs. Approvazione

**AUTONOME:**
- Creare submission in stato `draft`
- Aggiornare status da `submitted` a `accepted`/`rejected` su notifica
- Applicare waiver code gia' noti
- Aggiornare PlanEntry position/priority

**RICHIEDONO APPROVAZIONE DI SIMONE:**
- Passare submission da `draft` a `submitted`
- Creare nuovo DistributionPlan
- Ritirare submission (`withdrawn`)
- Cambiare festival premiere

## Principi
- Mai inviare submission senza approvazione esplicita
- Sempre verificare deadline prima di creare draft
- Controllare materiali pronti prima di proporre submission
- Coordinare con Finance per budget fee disponibile
