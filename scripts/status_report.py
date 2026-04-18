import sqlite3, json, sys
from datetime import datetime

db_path = 'prisma/dev.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

report = {}

# Tabelle esistenti
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables_exist = {r['name'] for r in c.fetchall()}
report['_tables'] = sorted(tables_exist)

def safe_count(t):
    if t not in tables_exist:
        return None
    c.execute(f"SELECT COUNT(*) as n FROM {t}")
    return c.fetchone()['n']

for t in ['Film', 'FestivalMaster', 'FestivalEdition', 'Submission',
          'DistributionPlan', 'Task', 'FinanceEntry', 'Person', 'FilmMaterial']:
    report[t] = safe_count(t)

if 'Task' in tables_exist:
    c.execute("SELECT COUNT(*) as n FROM Task WHERE status != 'done'")
    report['task_aperte'] = c.fetchone()['n']

# Deadline 7gg
if 'FestivalEdition' in tables_exist and 'FestivalMaster' in tables_exist:
    try:
        c.execute("""SELECT fe.id, fm.name, fm.country, fe.year,
          fe.activeDeadlineDate, fe.activeDeadlineType
          FROM FestivalEdition fe JOIN FestivalMaster fm ON fe.festivalMasterId = fm.id
          WHERE fe.activeDeadlineDate IS NOT NULL
          AND fe.activeDeadlineDate > datetime('now')
          AND fe.activeDeadlineDate < datetime('now', '+7 days')
          ORDER BY fe.activeDeadlineDate""")
        report['deadline_7'] = [dict(r) for r in c.fetchall()]
        c.execute("""SELECT fe.id, fm.name, fe.activeDeadlineDate, fe.activeDeadlineType
          FROM FestivalEdition fe JOIN FestivalMaster fm ON fe.festivalMasterId = fm.id
          WHERE fe.activeDeadlineDate > datetime('now', '+7 days')
          AND fe.activeDeadlineDate < datetime('now', '+14 days')
          ORDER BY fe.activeDeadlineDate""")
        report['deadline_14'] = [dict(r) for r in c.fetchall()]
    except Exception as e:
        report['deadline_err'] = str(e)

if 'FestivalMaster' in tables_exist:
    try:
        c.execute("SELECT COUNT(*) as n FROM FestivalMaster WHERE needsAiRefresh = 1")
        report['needs_refresh'] = c.fetchone()['n']
    except: pass
    try:
        c.execute("SELECT COUNT(*) as n FROM FestivalMaster WHERE verificationStatus IS NULL OR verificationStatus != 'verified'")
        report['unverified'] = c.fetchone()['n']
    except: pass

if 'Submission' in tables_exist:
    c.execute("SELECT status, COUNT(*) as n FROM Submission GROUP BY status")
    report['sub_by_status'] = {r['status']: r['n'] for r in c.fetchall()}
    c.execute("""SELECT
      COUNT(CASE WHEN status='accepted' THEN 1 END) as accepted,
      COUNT(CASE WHEN status IN ('accepted','rejected') THEN 1 END) as decided
      FROM Submission""")
    r = c.fetchone()
    report['acceptance_rate'] = round(r['accepted']/r['decided']*100, 1) if r['decided'] > 0 else 0
    try:
        c.execute("""SELECT s.id, f.titleOriginal, fm.name as fest, s.status, s.result, s.updatedAt
          FROM Submission s
          JOIN Film f ON f.id = s.filmId
          JOIN FestivalEdition fe ON fe.id = s.festivalEditionId
          JOIN FestivalMaster fm ON fm.id = fe.festivalMasterId
          WHERE s.updatedAt > datetime('now', '-7 days')
          AND s.status IN ('accepted', 'rejected')
          ORDER BY s.updatedAt DESC""")
        report['recent_results'] = [dict(r) for r in c.fetchall()]
    except Exception as e:
        report['recent_err'] = str(e)

if 'Film' in tables_exist and 'DistributionPlan' in tables_exist:
    try:
        c.execute("""SELECT f.id, f.titleOriginal FROM Film f
          LEFT JOIN DistributionPlan dp ON dp.filmId = f.id
          WHERE dp.id IS NULL""")
        report['film_no_plan'] = [dict(r) for r in c.fetchall()]
    except Exception as e:
        report['plan_err'] = str(e)

if 'FinanceEntry' in tables_exist:
    c.execute("SELECT type, SUM(amount) as total FROM FinanceEntry GROUP BY type")
    report['finance'] = {r['type']: r['total'] for r in c.fetchall()}
    c.execute("""SELECT category, SUM(amount) as total FROM FinanceEntry
      WHERE type='expense' GROUP BY category ORDER BY total DESC""")
    report['expense_breakdown'] = {r['category']: r['total'] for r in c.fetchall()}

if 'FilmMaterial' in tables_exist:
    try:
        c.execute("""SELECT fm.filmId, f.titleOriginal, fm.type
          FROM FilmMaterial fm JOIN Film f ON f.id = fm.filmId
          WHERE fm.isRequired = 1 AND fm.status = 'missing'""")
        report['missing_materials'] = [dict(r) for r in c.fetchall()]
    except Exception as e:
        report['mat_err'] = str(e)

if 'Task' in tables_exist:
    try:
        c.execute("""SELECT title, dueDate, priority FROM Task
          WHERE status != 'done' AND dueDate IS NOT NULL AND dueDate < datetime('now')""")
        report['overdue_tasks'] = [dict(r) for r in c.fetchall()]
    except Exception as e:
        report['task_err'] = str(e)

conn.close()
print(json.dumps(report, indent=2, default=str, ensure_ascii=False))
