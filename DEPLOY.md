# Deploy PunxFilm OS su Railway

## Pre-requisiti (già fatti ✓)

- [x] Schema Prisma con provider `postgresql`
- [x] Dati esportati in `prisma/data/*.json` (1815 festival, 553 edizioni, 7 film)
- [x] `prisma/seed.ts` legge dai JSON ed è idempotente
- [x] `package.json` scripts: `build` fa `prisma generate && prisma db push && next build`
- [x] `railway.toml` con config nixpacks
- [x] `.env.example` con tutte le variabili documentate
- [x] Railway CLI installata (v4.39.0)

## Step 1 — Login Railway

```bash
railway login
# Apre browser, conferma login con account GitHub/Google
```

## Step 2 — Creare progetto

```bash
cd /Users/punxfilm/Documents/VisualStudioCode/punxfilm-os
railway init
# Scegli nome progetto (es. punxfilm-os)
```

## Step 3 — Aggiungere Postgres

```bash
railway add --database postgres
# Railway genera automaticamente DATABASE_URL
```

## Step 4 — Configurare variabili d'ambiente

```bash
# NextAuth secret (genera uno nuovo, diverso da quello locale)
railway variables --set "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# URL pubblico (Railway lo fornisce dopo il primo deploy; per ora usa placeholder)
railway variables --set "NEXTAUTH_URL=https://your-app.up.railway.app"

# Anthropic API key (copia da .env locale)
railway variables --set "ANTHROPIC_API_KEY=sk-ant-api03-..."

# Admin user per seed iniziale
railway variables --set "ADMIN_EMAIL=simone@punxfilm.it"
railway variables --set "ADMIN_PASSWORD=<scegli-password-forte-min-12-caratteri>"

# Node env
railway variables --set "NODE_ENV=production"
```

## Step 5 — Deploy

```bash
railway up
# Carica il codice, Railway esegue automaticamente:
#   npm install
#   npm run build (→ prisma generate + db push + next build)
#   npm run start
```

Il primo deploy richiede circa 3-5 minuti. Al termine Railway assegna un URL pubblico
(es. `punxfilm-os-production.up.railway.app`).

## Step 6 — Aggiornare NEXTAUTH_URL e seed

```bash
# Prendi l'URL dal dashboard Railway o da:
railway domain

# Aggiornalo:
railway variables --set "NEXTAUTH_URL=https://punxfilm-os-production.up.railway.app"

# Esegui seed per popolare i festival
railway run npm run seed
```

## Step 7 — Smoke test

```bash
# Apri l'URL pubblico
open $(railway domain)

# Verifica:
# 1. Landing page carica con CTA login/register
# 2. /register crea il primo utente (che non diventa admin se ADMIN_EMAIL è diverso)
# 3. Login con admin credentials (quelle dal seed)
# 4. Dashboard mostra i 1815 festival
# 5. Logout funziona
```

## Troubleshooting

### "relation does not exist"
Il seed non è ancora stato eseguito. Lancia `railway run npm run seed`.

### "DATABASE_URL not found"
Verifica che il servizio Postgres sia linked al servizio Next.js:
```bash
railway status
# Deve mostrare entrambi i servizi
```

### Build timeout
Railway free tier ha limiti di memoria. Upgrade a Hobby ($5/mese) se necessario.

### NextAuth: UntrustedHost
`NEXTAUTH_URL` deve matchare esattamente l'URL pubblico (incluso `https://`).

## Aggiornamenti futuri

Ogni `git push` su main triggerà un deploy automatico (se linkato a GitHub).
Per deploy manuale: `railway up`.

Per aggiornare lo schema DB in futuro:
```bash
# In locale, modifica prisma/schema.prisma
# Poi push schema (senza migrations):
railway run npx prisma db push
```

Per creare migrations formali (consigliato dopo MVP):
```bash
npx prisma migrate dev --name description
git add prisma/migrations
git push
```

## Backup

Railway fa backup automatici del Postgres. Per backup manuale:
```bash
railway run pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```
