# DataBet App Blueprint

## 1. Objetivo del producto
- App iOS personal enfocada en registrar y analizar apuestas deportivas con dashboards configurables y series temporales.
- Uso principal: toma de decisiones propia; posibilidad de compartir con círculo reducido.
- Requisito clave: funcionamiento offline con sincronización posterior y métricas detalladas (yield, ROI, CLV, drawdowns, etc.).

## 2. Insights de mercado
- Referencias: Bet Analityx, Pikkit, BetMinder, Trademate, RebelBetting, Betting Tracker Pro.
- Métricas imprescindibles: profit/loss absoluto, yield %, ROI, unidades, hit rate, closing-line value, splits por deporte/mercado/bookie, rendimiento por stake plan y tipo de apuesta.
- Visualizaciones: curva de bankroll, histogramas de cuotas, heatmaps día/hora, comparativas vs CLV, tablas pivot con filtros por rango temporal, ranking de rachas/drawdowns.
- Funciones diferenciales para copiar/adaptar: importación CSV/API, etiquetas múltiples, alertas por desvíos del staking plan, tracking apertura/cierre, dashboards con widgets, exportaciones PDF/CSV y backups automáticos.

## 3. Arquitectura de datos
- **Base de datos**: PostgreSQL gestionado por Supabase (free tier, API REST/GraphQL + Auth + Storage). Justificación: SQL estándar, vistas/materialized views para KPIs, SDK oficial Swift.
- **Entidades principales**:
  - `users`: perfil, divisa base, zona horaria, preferencias.
  - `bankrolls`: múltiples fondos con movimientos (depósitos/retiros, transferencia interna).
  - `events` y `markets`: metadatos de partido, liga, tipo de mercado, cuotas de apertura/cierre.
  - `bookmakers`: casa, país, límites personalizados.
  - `bets`: FK a user/bankroll/event/market/bookmaker, stake, cuota, probabilidad implícita, timestamps, estado y resultado.
  - `bet_legs`: soporte para combinadas/parlays y mercados múltiples.
  - `odds_history`: tracking granular de movimiento de cuotas con timestamp/fuente.
  - `tags` + `bet_tags`: etiquetado libre (estrategia, tipster, deporte secundario).
  - `attachments`: slips/fotos en Supabase Storage.
- **Vistas recomendadas**: `bet_performance_by_period`, `clv_summary`, `bankroll_equity_curve`, `sport_market_split`. Triggers/cjobs: cálculos de yield rolling, drawdowns, snapshots mensuales.

## 4. Stack técnico
- **Frontend móvil**: SwiftUI + Swift Charts + Combine. Arquitectura MVVM con SwiftData/CoreData como cache offline. Diseño oscuro tipo trading con SF Symbols, soporte de widgets configurables.
- **Sincronización**: Supabase Swift SDK para Auth, PostgREST y tiempo real; reconciliación incremental (merge por `updated_at`).
- **Funciones backend**: Supabase Edge Functions (TypeScript/Deno) para procesar importaciones CSV, normalizar cuotas, generar KPIs pesados. Opción de microservicio NestJS/Fastify desplegado en Fly.io si surge lógica adicional.
- **Infraestructura desarrollo**: GitHub Codespaces para repositorio monorepo (Swift + infra). Swift Package Manager + SwiftLint + Tuist/XcodeGen. GitHub Actions para lint/tests y despliegue de funciones.
- **Diseño/UI**: Figma para prototipos, Lottie para microanimaciones (SDK oficial). Paleta custom + tipografía SF Pro.

## 5. Distribución en iPhone
- Objetivo principal: uso personal en España (UE) con iOS 17.4+.
- Flujo recomendado: AltStore PAL (marketplace alternativo UE) → instalación y renovaciones semanales desde el dispositivo (botón "Renew" antes del día 7). Máx. 3 apps simultáneas, requiere tocar manualmente cada semana.
- Alternativas: SideStore (VPN interno) o AltStore + servidor en NAS. Todos mantienen límite de 7 días. Si se desea distribución estable sin renovaciones semanales, implica cuenta Apple Developer (99 USD/año) + TestFlight/App Store.

## 6. Plan de ejecución
1. **Sprint 0**: Wireframes Figma, set up Supabase proyecto, definir SQL inicial y scripts seed, preparar repositorio con Tuist/XcodeGen y CI básico.
2. **Sprint 1**: Modelos de datos, authent Supabase, CRUD básico de bankrolls y apuestas, importador CSV manual.
3. **Sprint 2**: Sincronización offline (SwiftData ↔ Supabase), filtros avanzados por rango temporal, dashboards iniciales (equity curve, ROI mensual).
4. **Sprint 3**: CLV tracking, alertas staking plan, widgets configurables, exportaciones PDF/CSV.
5. **QA & Distribución**: Pruebas en dispositivos reales, checklist AltStore/TestFlight, documentación de uso y renovación semanal.

## 7. Próximos pasos inmediatos
- Crear proyecto Supabase + definir tablas iniciales.
- Configurar workspace Swift (Tuist/XcodeGen) en Codespaces.
- Preparar prototipo UI en Figma para validar layout de dashboard y flujo de alta de apuesta.
