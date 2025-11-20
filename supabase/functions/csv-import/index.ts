// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { parse } from "https://deno.land/std@0.224.0/csv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0?dts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STATUS = new Set([
  "pending",
  "won",
  "lost",
  "void",
  "cashed_out",
]);
const ALLOWED_BET_TYPE = new Set(["single", "multi", "system", "live"]);
const DEFAULT_BATCH_SIZE = Number(Deno.env.get("CSV_IMPORT_BATCH_SIZE") ?? "200");

type CsvRecord = Record<string, string | undefined>;

type BetInsertPayload = {
  bankroll_id: string;
  stake: number;
  odds: number;
  placed_at: string;
  notes?: string | null;
  status?: string;
  bet_type?: string;
  implied_probability?: number | null;
  bookmaker_id?: string;
  market_id?: string;
  event_id?: string;
  result_amount?: number | null;
  tags?: string[];
  id?: string;
  user_id?: string;
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Only POST supported" }, 405);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonResponse({ error: "Missing CSV file" }, 400);
    }

    const text = await file.text();
    if (!text.trim()) {
      return jsonResponse({ error: "Empty CSV" }, 400);
    }

    const parsed = parse(text, { header: true }) as CsvRecord[];
    const rows = parsed.filter((row) => hasContent(row));

    if (rows.length === 0) {
      return jsonResponse({ error: "CSV without data rows" }, 400);
    }

    const payloads: BetInsertPayload[] = [];
    const errors: { row: number; message: string }[] = [];

    rows.forEach((row, index) => {
      try {
        payloads.push(toBetPayload(row));
      } catch (error) {
        errors.push({ row: index + 2, message: toErrorMessage(error) });
      }
    });

    if (errors.length > 0) {
      return jsonResponse({ error: "Invalid CSV data", details: errors }, 400);
    }

    if (payloads.length === 0) {
      return jsonResponse({ error: "No valid rows" }, 400);
    }

    const batchSize = Number.isFinite(DEFAULT_BATCH_SIZE) && DEFAULT_BATCH_SIZE > 0
      ? DEFAULT_BATCH_SIZE
      : 200;

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      const { error } = await supabase.from("bets").insert(batch);
      if (error) {
        console.error("Insert failed", error);
        return jsonResponse({ error: error.message, details: error.details, hint: error.hint }, 500);
      }
    }

    return jsonResponse({ imported: payloads.length });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: toErrorMessage(error) }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hasContent(row: CsvRecord): boolean {
  return Object.values(row).some((value) => (value ?? "").trim().length > 0);
}

function toBetPayload(row: CsvRecord): BetInsertPayload {
  const bankrollId = requireUuid(row.bankroll_id ?? row.bankrollId, "bankroll_id");
  const stake = requireNumber(row.stake, "stake");
  const odds = requireNumber(row.odds, "odds");
  const placedAt = requireDate(row.placed_at ?? row.placedAt, "placed_at");

  const payload: BetInsertPayload = {
    bankroll_id: bankrollId,
    stake,
    odds,
    placed_at: placedAt,
  };

  const status = normalizeStatus(row.status);
  if (status) {
    payload.status = status;
  }

  const betType = normalizeBetType(row.wager_type ?? row.bet_type ?? row.betType);
  if (betType) {
    payload.bet_type = betType;
  }

  const probability = optionalNumber(row.probability ?? row.implied_probability ?? row.impliedProbability);
  if (probability !== null) {
    payload.implied_probability = probability;
  }

  const resultAmount = optionalNumber(row.result_amount ?? row.resultAmount);
  if (resultAmount !== null) {
    payload.result_amount = resultAmount;
  }

  payload.notes = optionalString(row.notes);
  const bookmakerId = optionalUuid(row.bookmaker_id ?? row.bookmakerId, "bookmaker_id");
  if (bookmakerId) {
    payload.bookmaker_id = bookmakerId;
  }
  const eventId = optionalUuid(row.event_id ?? row.eventId, "event_id");
  if (eventId) {
    payload.event_id = eventId;
  }
  const marketId = optionalUuid(row.market_id ?? row.marketId, "market_id");
  if (marketId) {
    payload.market_id = marketId;
  }
  const userId = optionalUuid(row.user_id ?? row.userId, "user_id");
  if (userId) {
    payload.user_id = userId;
  }

  const tags = parseTags(row.tags ?? row.Tags);
  if (tags.length > 0) {
    payload.tags = tags;
  }

  const incomingId = optionalUuid(row.id, "id");
  if (incomingId) {
    payload.id = incomingId;
  }

  return payload;
}

function requireUuid(value: string | undefined, field: string): string {
  const trimmed = (value ?? "").trim();
  if (!UUID_REGEX.test(trimmed)) {
    throw new Error(`${field} must be a valid UUID`);
  }
  return trimmed;
}

function optionalUuid(value: string | undefined, field: string): string | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return undefined;
  }
  if (!UUID_REGEX.test(trimmed)) {
    throw new Error(`${field} must be a valid UUID`);
  }
  return trimmed;
}

function requireNumber(value: string | undefined, field: string): number {
  const num = Number((value ?? "").trim());
  if (!Number.isFinite(num)) {
    throw new Error(`${field} must be a numeric value`);
  }
  return num;
}

function optionalNumber(value: string | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return num;
}

function requireDate(value: string | undefined, field: string): string {
  const trimmed = (value ?? "").trim();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid ISO date`);
  }
  return date.toISOString();
}

function optionalString(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStatus(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase().replace(/[- ]/g, "_");
  if (!ALLOWED_STATUS.has(normalized)) {
    throw new Error(`Invalid status: ${value}`);
  }
  return normalized;
}

function normalizeBetType(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!ALLOWED_BET_TYPE.has(normalized)) {
    throw new Error(`Invalid wager_type: ${value}`);
  }
  return normalized;
}

function parseTags(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/[|;,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
