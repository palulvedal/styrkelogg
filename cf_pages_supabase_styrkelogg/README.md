# Styrkelogg for Cloudflare Pages + Supabase

Denne versjonen er bygget for:
- **Cloudflare Pages** som hosting av frontend
- **Supabase Auth** for registrering / innlogging
- **Supabase Postgres** for lagring av økter

Appen er helt uten egen backend. Dataene lagres i Supabase, og tilgang styres med Row Level Security (RLS).

## Hva som er med
- mobilvennlig UI
- registrering og innlogging
- to ferdige økter med supersett
- logging av sett, reps, kilo og sekunder
- historikk med sletting
- grafer for:
  - økter per uke
  - styrketrend
  - volum per uke
  - beste noteringer
- eksport og import av JSON-backup

## 1. Opprett Supabase-prosjekt
Opprett et nytt prosjekt i Supabase.

Finn deretter:
- **Project URL**
- **anon key**

Du trenger disse som:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 2. Kjør SQL-oppsettet
Åpne **SQL Editor** i Supabase og kjør:

- `supabase/001_workout_sessions.sql`

Dette oppretter:
- tabellen `public.workout_sessions`
- indekser
- trigger for `updated_at`
- RLS-policyer som gjør at hver bruker bare ser og endrer egne økter

## 3. Sett opp auth
I Supabase:
- Gå til **Authentication**
- Sørg for at e-post/passord er aktivert

For enklest mulig oppsett kan du slå av e-postbekreftelse.
Hvis du vil beholde e-postbekreftelse:
- sett **Site URL** til Cloudflare Pages-adressen din
- legg samme URL til som redirect URL ved behov

## 4. Deploy til Cloudflare Pages

### Via Git
Legg prosjektet i et Git-repo og opprett et nytt Pages-prosjekt.

Bruk disse innstillingene:
- **Build command:** `node scripts/build.mjs`
- **Build output directory:** `dist`

Legg til miljøvariabler i Pages:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Via Direct Upload
Du kan også bygge lokalt og laste opp `dist/`.

Lokalt:
```bash
export SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
export SUPABASE_ANON_KEY="YOUR_ANON_KEY"
node scripts/build.mjs
```

Deretter kan `dist/` deployes til Pages.

## 5. Lokal test
Bygg først:
```bash
export SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
export SUPABASE_ANON_KEY="YOUR_ANON_KEY"
node scripts/build.mjs
```

Kjør så en enkel lokal server:
```bash
python3 -m http.server 8788 -d dist
```

Åpne deretter:
- `http://127.0.0.1:8788`

## Filstruktur
- `src/index.html` – HTML
- `src/styles.css` – styling
- `src/app.js` – all frontendlogikk
- `scripts/build.mjs` – bygger `dist/` og injiserer config
- `supabase/001_workout_sessions.sql` – database og RLS

## Viktige notater
- `SUPABASE_ANON_KEY` er ment for frontend-bruk, men appen forutsetter at RLS er aktiv.
- Hvis du bytter domene senere, oppdater **Site URL** i Supabase.
- `dist/app-config.js` markeres som `no-store` i `_headers` for å redusere caching av config.
