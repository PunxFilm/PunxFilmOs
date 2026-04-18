---
name: punxfilm-direttore-generale
description: "Coordina tutti i reparti di PunxFilm OS: genera report mattutini, gestisci priorita', coordina workflow tra reparti, escalation decisioni, panoramica generale. Usa questa skill quando l'utente chiede un report, vuole sapere lo stato generale dell'app, chiede delle priorita', vuole coordinare azioni tra reparti, o ha bisogno di una visione d'insieme su PunxFilm OS."
---

# PunxFilm Direttore Generale

Skill di coordinamento per tutti i 6 reparti di PunxFilm OS. Produce report, gestisce priorita' e coordina i workflow inter-reparto.

## Reparti Coordinati

1. **SCOUTING & FESTIVAL** — skill: `punxfilm-festival-manager`
2. **DISTRIBUZIONE & SUBMISSION** — skill: `punxfilm-distribution-manager`
3. **DEV OPS** — skill: `punxfilm-code-improver`
4. **AI & STRATEGY** — skill: `punxfilm-ai-enhancer`
5. **FINANCE** — skill: `punxfilm-finance-controller`
6. **QA & DATA** — skill: `punxfilm-qa-inspector`

## Organigramma Completo

Documento di riferimento: `/reports/org-chart-agenti-punxfilm.md`

## Generazione Report Mattutino

### Step 1: Raccolta Dati

Esegui tutte le query in un unico script Python:

```python
import sqlite3, json
from datetime import datetime, timedelta

db_path = 'prisma/dev.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

report = {}

# === DASHBOARD KPI ===
tables = ['Film', 'FestivalMaster', 'FestivalEdition', 'Submission', 
          'DistributionPlan', 'Task', 'FinanceEntry', 'Person']
for t in tables:
    c.execute(f"SELECT COUNT(*) as n FROM {t}")
    report[t] = c.fetchone()['n']

# Task aperte
c.execute("SELECT COUNT(*) as n FROM Task WHERE status != 'done'")
report['task_aperte'] = c.fetchone()['n']

# === REPARTO 1: SCOUTING ===
# Deadline 7 giorni
c.execute("""SELECT fe.id, fm.name, fm.country, fe.year, 
  fe.activeDeadlineDate, fe.activeDeadlineType, fe.daysToDeadline
  FROM FestivalEdition fe JOIN FestivalMaster fm ON fe.festivalMasterId = fm.id
  WHERE fe.activeDeadlineDate IS NOT NULL 
  AND fe.activeDeadlineDate > datetime('now') 
  AND fe.activeDeadlineDate < datetime('now', '+7 days')
  ORDER BY fe.activeDeadlineDate""")
report['deadline_7'] = [dict(r) for r in c.fetchall()]

# Deadline 14 giorni
c.execute("""SELECT fe.id, fm.name, fe.activeDeadlineDate, fe.activeDeadlineType
  FROM FestivalEdition fe JOIN FestivalMaster fm ON fe.festivalMasterId = fm.id
  WHERE fe.activeDeadlineDate > datetime('now', '+7 days')
  AND fe.activeDeadlineDate < datetime('now', '+14 days')
  ORDER BY fe.activeDeadlineDate""")
report['deadline_14'] = [dict(r) for r in c.fetchall()]

# Festival da verificare
c.execute("SELECT COUNT(*) as n FROM FestivalMaster WHERE needsAiRefresh = 1")
report['needs_refresh'] = c.fetchone()['n']
c.execute("SELECT COUNT(*) as n FROM FestivalMaster WHERE verificationStatus IS NULL OR verificationStatus != 'verified'")
report['unverified'] = c.fetchone()['n']

# === REPARTO 2: DISTRIBUZIONE ===
c.execute("SELECT status, COUNT(*) as n FROM Submission GROUP BY status")
report['sub_by_status'] = {r['status']: r['n'] for r in c.fetchall()}

# Film senza piano
c.execute("""SELECT f.id, f.titleOriginal FROM Film f
  LEFT JOIN DistributionPlan dp ON dp.filmId = f.id
  WHERE dp.id IS NULL AND f.status IN ('active','in_distribuzione')""")
report['film_no_plan'] = [dict(r) for r in c.fetchall()]

# Risultati recenti (7 giorni)
c.execute("""SELECT s.id, f.titleOriginal, fm.name, s.status, s.result, s.updatedAt
  FROM Submission s 
  JOIN Film f ON f.id = s.filmId 
  JOIN FestivalEdition fe ON fe.id = s.festivalEditionId 
  JOIN FestivalMaster fm ON fm.id = fe.festivalMasterId
  WHERE s.updatedAt > datetime('now', '-7 days')
  AND s.status IN ('accepted', 'rejected')
  ORDER BY s.updatedAt DESC""")
report['recent_results'] = [dict(r) for r in c.fetchall()]

# Tasso accettazione
c.execute("""SELECT 
  COUNT(CASE WHEN status='accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN status IN ('accepted','rejected') THEN 1 END) as decided
  FROM Submission""")
r = c.fetchone()
report['acceptance_rate'] = round(r['accepted']/r['decided']*100, 1) if r['decided'] > 0 else 0

# === REPARTO 5: FINANCE ===
c.execute("SELECT type, SUM(amount) as total FROM FinanceEntry GROUP BY type")
report['finance'] = {r['type']: r['total'] for r in c.fetchall()}

c.execute("""SELECT category, SUM(amount) as total FROM FinanceEntry 
  WHERE type='expense' GROUP BY category ORDER BY total DESC""")
report['expense_breakdown'] = {r['category']: r['total'] for r in c.fetchall()}

# === REPARTO 6: QA ===
# Materiali mancanti obbligatori
c.execute("""SELECT fm.filmId, f.titleOriginal, fm.type
  FROM FilmMaterial fm JOIN Film f ON f.id = fm.filmId
  WHERE fm.isRequired = 1 AND fm.status = 'missing'""")
report['missing_materials'] = [dict(r) for r in c.fetchall()]

# Task scadute
c.execute("""SELECT title, dueDate, priority FROM Task
  WHERE status != 'done' AND dueDate IS NOT NULL AND dueDate < datetime('now')""")
report['overdue_tasks'] = [dict(r) for r in c.fetchall()]

conn.close()
```

### Step 2: Genera Markdown

Usa i dati raccolti per compilare il template del report mattutino. Salvalo in:
`/reports/morning-report-YYYY-MM-DD.md`

### Step 3: Identifica Priorita'

Ordine di priorita' automatico:
1. **CRITICO**: Deadline nei prossimi 3 giorni senza submission pronta
2. **URGENTE**: Materiali obbligatori mancanti per film con submission imminenti
3. **IMPORTANTE**: Film attivi senza piano distribuzione
4. **NORMALE**: Deadline 7-14 giorni, task QA, aggiornamenti festival
5. **BASSA**: Ottimizzazioni AI, refactoring codice, verifiche dati

### Step 4: Decisioni in Attesa

Raccogli tutte le azioni che richiedono approvazione di Simone:
- Submission da inviare (draft → submitted)
- Nuovi piani distribuzione da attivare
- Spese > EUR 500
- Import massivi di festival
- Nuove feature o modifiche architetturali

Per ogni decisione, fornisci:
- **Contesto**: Perche' serve
- **Raccomandazione DG**: Cosa consigliamo
- **Urgenza**: Quanto e' urgente decidere

## Escalation Matrix

| Livello | Tipo | Chi Decide |
|---------|------|------------|
| 0 | Routine | Reparto autonomo |
| 1 | Non standard | Reparto + DG |
| 2 | Strategica | DG + Simone |
| 3 | Critica (>EUR500, A-list, architettura) | Solo Simone |

## Workflow Inter-Reparto

### Nuovo Film → Distribuzione
SCOUTING identifica festival → AI analizza film → DISTRIBUZIONE crea piano → QA verifica materiali → FINANCE stima budget

### Deadline Imminente
SCOUTING segnala → DISTRIBUZIONE verifica submission → QA controlla materiali → FINANCE conferma budget → DISTRIBUZIONE submit (con OK Simone)

### Risultato Festival
DISTRIBUZIONE aggiorna status → FINANCE registra premio/spesa → AI analizza pattern → DG riporta

### Bug/Problema
QA identifica → DEV OPS corregge → QA verifica fix → DG riporta
