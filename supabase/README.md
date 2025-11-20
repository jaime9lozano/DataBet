# Supabase Setup

## Prerequisites
- Supabase account (free tier) and CLI (`npm i -g supabase`).
- `supabase login` already executed in your Codespaces shell.

## Initialize project
```bash
supabase init
```
This command creates `.supabase/` metadata. Commit it if you want team members to run migrations easily.

## Apply schema locally
```bash
supabase db reset
```
This will run `supabase/schema.sql` and the seed scripts inside `supabase/seed/` automatically.

## Deploy to hosted project
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Edge Functions
- Directorio `supabase/functions/`.
- Servir en local: `supabase functions serve csv-import --env-file ../.env`
- Desplegar: `supabase functions deploy csv-import`
- Define `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` en el dashboard de funciones.

## Environment variables for the Swift app
Create `ios/.env.local.example` with:
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-public-key>
```
Load them in Xcode run scheme or through `xcodebuild` arguments, then wire them into `SupabaseClientFactory.makeClient`.

## Edge Functions suggestion
- Use TypeScript functions for CSV import, scheduled KPI snapshots and CLV crunching.
- Add scripts later under `supabase/functions/` and deploy with `supabase functions deploy <name>`.
