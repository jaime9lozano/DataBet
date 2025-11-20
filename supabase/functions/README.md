# Supabase Edge Functions

## csv-import
Importa un CSV con apuestas y las inserta usando la service role key directamente en `bets`.

### Ejecutar en local
```bash
supabase functions serve csv-import --env-file ../.env.local
```

- Requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (se lee también `CSV_IMPORT_BATCH_SIZE`, por defecto 200 filas por lote).
- Espera un `POST multipart/form-data` con un campo `file` (el nombre es obligatorio) que contenga el CSV.

### Despliegue
```bash
supabase functions deploy csv-import
```
En el dashboard asigna las variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y, si quieres, `CSV_IMPORT_BATCH_SIZE`.

### Formato CSV

Cabeceras obligatorias: `bankroll_id`, `stake`, `odds`, `placed_at` (ISO 8601). Ejemplo mínimo:

```
bankroll_id,stake,odds,placed_at,notes
<uuid>,50,2.10,2025-01-01T20:00:00Z,Lakers ML
```

Columnas opcionales (el validador las reconoce en snake_case o camelCase):

| Columna | Destino | Notas |
| --- | --- | --- |
| `status` | `bets.status` | `pending`, `won`, `lost`, `void`, `cashed_out` |
| `wager_type` / `bet_type` | `bets.bet_type` | `single`, `multi`, `system`, `live` |
| `probability` / `implied_probability` | `bets.implied_probability` | Número decimal |
| `bookmaker_id`, `event_id`, `market_id`, `user_id`, `id` | columnas homónimas | Deben ser UUID válidos |
| `result_amount` | `bets.result_amount` | Decimal |
| `tags` | `bets.tags` | Lista separada por `,`, `;` o `|` |
| `notes` | `bets.notes` | Texto libre |

### Respuesta de la función

```jsonc
{ "imported": 42 }
```

Si alguna fila es inválida la función devuelve `400` con la lista de errores por número de fila (contando cabecera como fila 1).

### Ejemplo `curl`

```bash
curl \
	-X POST \
	-H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
	-F "file=@bets.csv" \
	https://<project-ref>.functions.supabase.co/csv-import
```
