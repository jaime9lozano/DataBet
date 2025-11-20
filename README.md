# DataBet

Dashboard de gestión de apuestas construido como **Progressive Web App** (React + Vite) sobre Supabase.

## Estructura
- `docs/`: documentación de producto (por ahora `project-brief.md`).
- `supabase/`: esquema SQL, seeds y funciones Edge.
- `supabase/functions/`: automatizaciones (p. ej. `csv-import`).
- `web/`: frontend PWA en React/TypeScript (Vite).

## Puesta en marcha rápida
1. **Supabase**
   - Instala la CLI siguiendo [la guía oficial](https://github.com/supabase/cli#install-the-cli).
   - `cd supabase && supabase init` (una vez).
   - `supabase db reset` para levantar la base local con `schema.sql` + `seed/`.
   - `supabase link --project-ref <ref>` y `supabase db push` para aplicar cambios en la nube.
2. **Frontend web**
   - `cd web && npm install`.
   - Copia `.env.example` → `.env.local` y rellena `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
   - `npm run dev` para arrancar Vite (http://localhost:5173).
   - `npm run build && npm run preview` para validar el bundle de producción.

## Integración Supabase
- El cliente vive en `web/src/lib/supabaseClient.ts` usando `VITE_SUPABASE_*`.
- Tipos de dominio (`Bet`, filtros…) están en `web/src/lib/types.ts`.
- Servicios reutilizables (`fetchBets`, `createBet`, auth email/password) se agrupan en `web/src/lib/services/`.

## PWA y despliegue
- `vite.config.ts` ya incluye `vite-plugin-pwa` con manifest, iconos y auto-update para el service worker.
- `netlify.toml` define la configuración oficial de CI (base `web/`, Node 20, redirect SPA). Solo necesitas conectar el repo en Netlify y usar `npm ci && npm run build` como comando.
- Variables de entorno obligatorias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Builds + Deploy Previews).
- Consulta `docs/netlify.md` para el paso a paso, despliegues manuales con el CLI y el checklist de pruebas PWA en móvil.
- Una vez desplegada, Safari/Chrome permiten “Añadir a pantalla de inicio”. También puedes crear un Atajo iOS que abra `https://<tu-dominio>.netlify.app` para simular un icono de app.

## Próximos pasos
- Montar el layout real (Dashboard, Bet List, Add Bet, Auth) usando los servicios creados.
- Añadir React Query/Zustand para estado global y cache offline básica.
- Integrar la importación CSV dentro de la nueva UI.
