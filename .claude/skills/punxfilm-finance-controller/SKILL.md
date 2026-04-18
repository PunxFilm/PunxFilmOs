---
name: punxfilm-finance-controller
description: "Gestisci finanze di PunxFilm OS: registra spese e entrate, calcola budget per film, monitora fee submission, traccia premi e screening fee, genera report finanziari, calcola ROI distribuzione. Usa questa skill quando l'utente parla di budget, spese, entrate, fee, premi, costi distribuzione, ROI, bilancio, o qualsiasi aspetto finanziario della distribuzione cortometraggi."
---

# PunxFilm Finance Controller

Skill per la gestione completa delle finanze di distribuzione in PunxFilm OS.

## Contesto App

PunxFilm OS e' un'app Next.js 14 con Prisma + SQLite per la distribuzione di cortometraggi nei festival. Il database e' in `prisma/dev.db` alla root del progetto.

## Schema Database di Competenza

### FinanceEntry
```
FinanceEntry (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL (expense|income),
  category TEXT NOT NULL (submission_fee|travel|award|screening_fee|other),
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  date DATETIME NOT NULL,
  filmTitle TEXT,
  festivalName TEXT,
  createdAt DATETIME,
  updatedAt DATETIME
)
INDEX: date, type
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

### Submission (sola lettura — per fee tracking)
```
Submission.estimatedFee, Submission.feesPaid, Submission.prizeAmount, Submission.waiverApplied
```

## OPERAZIONI DISPONIBILI

### 1. Registrare Spese e Entrate

```python
import sqlite3, json, uuid
from datetime import datetime

db_path = 'prisma/dev.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Registra spesa
entry_id = uuid.uuid4().hex[:25]
now = datetime.now().isoformat()
c.execute("""INSERT INTO FinanceEntry 
  (id, type, category, amount, currency, description, date, filmTitle, festivalName, createdAt, updatedAt)
  VALUES (?, 'expense', ?, ?, 'EUR', ?, ?, ?, ?, ?, ?)""",
  (entry_id, category, amount, description, date, film_title, festival_name, now, now))

# Registra entrata (premio)
c.execute("""INSERT INTO FinanceEntry 
  (id, type, category, amount, currency, description, date, filmTitle, festivalName, createdAt, updatedAt)
  VALUES (?, 'income', 'award', ?, 'EUR', ?, ?, ?, ?, ?, ?)""",
  (entry_id, amount, description, date, film_title, festival_name, now, now))

conn.commit()
conn.close()
```

### 2. Report Finanziari

**Bilancio generale:**
```python
c.execute("""SELECT type, SUM(amount) as total FROM FinanceEntry GROUP BY type""")

c.execute("""SELECT category, SUM(amount) as total 
  FROM FinanceEntry WHERE type = 'expense' GROUP BY category ORDER BY total DESC""")
```

**Per film:**
```python
c.execute("""SELECT filmTitle, type, SUM(amount) as total 
  FROM FinanceEntry GROUP BY filmTitle, type""")
```

**Per periodo:**
```python
c.execute("""SELECT strftime('%Y-%m', date) as mese, type, SUM(amount) as total
  FROM FinanceEntry GROUP BY mese, type ORDER BY mese""")
```

**ROI per film:**
```python
c.execute("""SELECT filmTitle,
  SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as spese,
  SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as entrate,
  SUM(CASE WHEN type='income' THEN amount ELSE -amount END) as roi
  FROM FinanceEntry GROUP BY filmTitle""")
```

### 3. Monitoraggio Fee Submission

```python
# Fee pagate vs. stimate
c.execute("""SELECT s.id, f.titleOriginal, fm.name, 
  s.estimatedFee, s.feesPaid, s.waiverApplied
  FROM Submission s
  JOIN Film f ON f.id = s.filmId
  JOIN FestivalEdition fe ON fe.id = s.festivalEditionId
  JOIN FestivalMaster fm ON fm.id = fe.festivalMasterId
  WHERE s.status IN ('draft','submitted')""")

# Risparmio waiver
c.execute("""SELECT SUM(estimatedFee) as risparmiato
  FROM Submission WHERE waiverApplied = 1""")
```

### 4. Gestione Contratti

```python
# Contratti attivi
c.execute("""SELECT dc.*, f.titleOriginal 
  FROM DistributionContract dc JOIN Film f ON f.id = dc.filmId
  WHERE dc.status = 'active'""")

# Contratti in scadenza
c.execute("""SELECT dc.*, f.titleOriginal 
  FROM DistributionContract dc JOIN Film f ON f.id = dc.filmId
  WHERE dc.endDate < datetime('now', '+30 days') AND dc.status = 'active'""")
```

### 5. Previsione Budget

Per ogni piano di distribuzione in fase di creazione, calcola:
```python
# Costo stimato piano
c.execute("""SELECT pe.estimatedFee, pe.waiverApplied, fm.name
  FROM PlanEntry pe 
  JOIN FestivalMaster fm ON fm.id = pe.festivalMasterId
  WHERE pe.planId = ? AND pe.status IN ('pending','approved')""", (plan_id,))

# Somma fee non coperte da waiver
total_estimated = sum(row['estimatedFee'] or 0 for row in entries if not row['waiverApplied'])
```

## Decisioni Autonome vs. Approvazione

**AUTONOME:**
- Registrare spese < EUR 500 confermate
- Registrare entrate (premi, screening fee)
- Aggiornare status contratti per date scadute
- Generare report finanziari

**RICHIEDONO APPROVAZIONE DI SIMONE:**
- Spese singole > EUR 500
- Modifica budget annuale
- Stipula/terminazione contratti
- Allocazione budget tra film diversi

## Categorie Spesa Standard
- `submission_fee` — Fee di iscrizione ai festival
- `travel` — Viaggio, alloggio, trasporti per festival
- `award` — Entrata da premio (type: income)
- `screening_fee` — Entrata da screening fee (type: income)
- `other` — Altre spese/entrate

## Principi
- Tutte le cifre in EUR salvo diversa indicazione
- Sempre collegare spesa/entrata al film e festival specifico
- Monitorare proattivamente sforamenti budget
- Segnalare nel report mattutino fee imminenti da pagare
