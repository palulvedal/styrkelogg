# Styrkelogg for Cloudflare Pages + D1 + Access

Alt kjører hos Cloudflare:
- **Cloudflare Pages** hoster frontend
- **Pages Functions** (`functions/`) er et lite API under `/api`
- **Cloudflare D1** (SQLite) lagrer øktene – settes ikke på pause ved inaktivitet
- **Cloudflare Access** står for innlogging (engangskode på e-post)

Appen har ingen egne passord. Access slipper bare inn e-postadressene du har godkjent,
og API-et verifiserer Access-tokenet på hver forespørsel. Hver bruker ser bare egne økter.

## Hva som er med
- mobilvennlig UI
- to ferdige økter med supersett
- logging av sett, reps, kilo og sekunder
- historikk med sletting
- grafer for økter per uke, styrketrend, volum per uke og beste noteringer
- eksport og import av JSON-backup

## 1. D1-database
Databasen `styrkelogg` er opprettet, og ID-en står i `wrangler.toml`.
Tabellen opprettes av `migrations/0001_workout_sessions.sql`. Slik kjører du den selv:

```bash
npx wrangler d1 migrations apply styrkelogg --remote
```

## 2. Pages-prosjekt
Med Git-tilkobling bruker du:
- **Root directory:** `cf_pages_supabase_styrkelogg`
- **Build command:** `node scripts/build.mjs`
- **Build output directory:** `dist`

`wrangler.toml` kobler D1-databasen til prosjektet som `DB`.
Miljøvariablene `SUPABASE_URL` og `SUPABASE_ANON_KEY` trengs ikke lenger og kan slettes.

## 3. Cloudflare Access
Appen bruker `https://styrkelogg.berg-ulvedal.no`, som er beskyttet av Access
(team `berg-ulvedal`). `styrkelogg.pages.dev` sendes videre dit av `functions/_middleware.js`.

Ved oppsett på nytt:
1. Åpne **Zero Trust → Access → Applications → Add an application → Self-hosted**
   og legg inn domenet appen bruker.
2. Lag en policy med **Action: Allow** og **Include → Emails** med de godkjente e-postene.
   **One-time PIN** holder som innloggingsmetode.
3. Kopier **Application Audience (AUD) Tag** og fyll inn `wrangler.toml`:
   ```toml
   [vars]
   ACCESS_TEAM_DOMAIN = "https://<team-navn>.cloudflareaccess.com"
   ACCESS_AUD = "<AUD-tag>"
   CANONICAL_HOST = "<domenet>"
   ```

Uten `ACCESS_TEAM_DOMAIN` og `ACCESS_AUD` avviser API-et alle forespørsler.

## 4. Flytte data fra Supabase
1. Åpne den gamle appen og velg **Historikk → Eksporter data**.
2. Åpne den nye appen og velg **Historikk → Importer data**.

## 5. Lokal test
```bash
npm install
npm run db:migrate:local
echo DEV_USER_EMAIL=deg@eksempel.no > .dev.vars
npm run dev
```
Så åpner du `http://127.0.0.1:8788`. Lokalt hopper API-et over Access-sjekken, siden
`DEV_USER_EMAIL` er satt og `ACCESS_AUD` står tom.

## Filstruktur
- `src/` – HTML, CSS og frontendlogikk
- `functions/api/_middleware.js` – verifiserer Access-token
- `functions/api/me.js` – hvem er logget inn
- `functions/api/sessions/` – hente, lagre, importere og slette økter
- `functions/_lib.js` – felles validering og SQL
- `migrations/` – D1-skjema
- `scripts/build.mjs` – bygger `dist/`
