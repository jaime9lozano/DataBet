# Despliegue en Netlify

Esta guía resume la configuración de CI/CD para publicar el panel DataBet en Netlify y validar la PWA en dispositivos móviles.

## 1. Conecta el repositorio
1. En Netlify crea un **New site > Import from Git** y selecciona este repo.
2. En "Basic build settings" define:
   - **Base directory**: `web`
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `dist`
3. Establece las variables de entorno (Settings > Environment):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Guarda los cambios y dispara el primer deploy; Netlify usará `netlify.toml` para mantener la configuración (Node 20 y redirect SPA).

## 2. Despliegues manuales/previos
Si necesitas probar un cambio antes de fusionarlo:

```bash
cd web
npm ci
npm run deploy:netlify
```

> El script ejecuta `netlify deploy`, por lo que necesitas el CLI (`npm i -g netlify-cli`) y haber corrido `netlify login` una vez.

## 3. Checklist PWA en móvil
1. Abre la URL del deploy (`https://<tu-sitio>.netlify.app`) desde Chrome en Android o Safari en iOS.
2. Revisa el manifest en `View Source` o `chrome://inspect` para confirmar nombre/icono.
3. Usa la opción "Add to Home Screen" y verifica:
   - Splash/ícono correcto.
   - Carga en pantalla completa y navegación sin barra.
4. Activa modo avión tras la primera carga y confirma que los recursos precacheados (`sw.js`) permiten abrir el dashboard offline.
5. Si algo falla, vuelve a ejecutar `npm run build` y revisa la consola del Service Worker.

## 4. Automatización adicional
- Puedes habilitar **Deploy Previews** para cada PR (Netlify lo hace automáticamente al conectar GitHub).
- En Settings > Build & deploy > Deploy notifications, suscríbete a los eventos de `Deploy failed` para enterarte de errores de CI.
- Para pruebas end-to-end futuras, añade un job de Playwright/Cypress que apunte al preview (`NETLIFY=true`).
