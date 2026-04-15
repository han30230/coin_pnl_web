import { getExchangeAccountsFromEnv } from "@/server/config/accounts";
import { getRuntimeConfig } from "@/server/config/runtime";
import { BinanceAdapter } from "@/server/exchanges/binance-adapter";
import { BybitAdapter } from "@/server/exchanges/bybit-adapter";
import type { AccountSnapshot, Exchange, ExchangeAdapter, TimeRange } from "@/server/exchanges/common";
import { HttpError } from "@/server/http/http-client";
import { makeMockSnapshots } from "./mock";

const adapters: Record<Exchange, ExchangeAdapter> = {
  binance: new BinanceAdapter(),
  bybit: new BybitAdapter(),
};

type FetchResult =
  | { ok: true; snapshot: AccountSnapshot }
  | { ok: false; error: { accountId: string; exchange: Exchange; label: string; message: string } };

async function fetchOne(args: {
  accountId: string;
  exchange: Exchange;
  label: string;
  apiKey: string;
  apiSecret: string;
  range: TimeRange;
  timeoutMs: number;
}): Promise<FetchResult> {
  try {
    const adapter = adapters[args.exchange];
    const snapshot = await adapter.fetchAccountSnapshot({
      accountId: args.accountId,
      label: args.label,
      apiKey: args.apiKey,
      apiSecret: args.apiSecret,
      range: args.range,
      timeoutMs: args.timeoutMs,
    });
    return { ok: true, snapshot };
  } catch (e) {
    const message = toSafeClientErrorMessage(args.exchange, e);
    if (process.env.NODE_ENV !== "production") {
      const raw = e instanceof Error ? e.message : String(e);
      // Avoid printing anything that might include signatures or keys.
      console.error(`[exchange:${args.exchange}] ${args.accountId} failed: ${raw.replaceAll(args.apiKey, "***").slice(0, 400)}`);
    }
    return { ok: false, error: { accountId: args.accountId, exchange: args.exchange, label: args.label, message } };
  }
}

function toSafeClientErrorMessage(exchange: Exchange, e: unknown) {
  // Never leak signed URLs, signatures, api keys, or raw exchange payloads to the client.
  if (e instanceof HttpError) {
    const status = e.status ?? 0;
    if (status === 401 || status === 403) return `${exchange.toUpperCase()} auth failed (check API key permissions)`;
    if (status === 429) return `${exchange.toUpperCase()} rate-limited (retry later)`;
    if (status >= 500) return `${exchange.toUpperCase()} upstream error (retry later)`;
    return `${exchange.toUpperCase()} request failed (HTTP ${status || "?"})`;
  }

  const raw = e instanceof Error ? e.message : "Unknown error";
  if (raw.toLowerCase().includes("wallet-balance")) return `${exchange.toUpperCase()} wallet endpoint failed`;
  if (raw.toLowerCase().includes("closed-pnl")) return `${exchange.toUpperCase()} closed PnL endpoint failed`;
  if (raw.toLowerCase().includes("origin_string")) return `${exchange.toUpperCase()} signature error (check API key/secret)`;
  if (raw.toLowerCase().includes("sign")) return `${exchange.toUpperCase()} request signing failed`;
  return `${exchange.toUpperCase()} request failed`;
}

// Simple in-memory cache (per server instance)
export type SnapshotError = { accountId: string; exchange: Exchange; label: string; message: string };
export type SnapshotBundle = { snapshots: AccountSnapshot[]; errors: SnapshotError[] };

type CacheEntry = { expiresAt: number; value: SnapshotBundle };
const cache = new Map<string, CacheEntry>();

export async function fetchSnapshots(args: {
  exchange: Exchange | "all";
  accountIds?: string[];
  range: TimeRange;
}): Promise<SnapshotBundle> {
  const rt = getRuntimeConfig();
  if (rt.USE_MOCK_DATA) {
    const all = makeMockSnapshots();
    return { snapshots: all, errors: [] };
  }

  const accounts = getExchangeAccountsFromEnv();
  const filtered = accounts.filter((a) => {
    if (args.exchange !== "all" && a.exchange !== args.exchange) return false;
    if (args.accountIds && args.accountIds.length > 0 && !args.accountIds.includes(a.accountId)) return false;
    return true;
  });

  const cacheKey = JSON.stringify({
    ex: args.exchange,
    ids: args.accountIds?.slice().sort() ?? [],
    start: args.range.startMs,
    end: args.range.endMs,
  });

  const ttlMs = rt.CACHE_TTL_SECONDS * 1000;
  if (ttlMs > 0) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value;
    }
  }

  const results = await Promise.all(
    filtered.map((a) =>
      fetchOne({
        accountId: a.accountId,
        exchange: a.exchange,
        label: a.label,
        apiKey: a.apiKey,
        apiSecret: a.apiSecret,
        range: args.range,
        timeoutMs: rt.API_TIMEOUT_MS,
      }),
    ),
  );

  const snapshots = results.filter((r): r is { ok: true; snapshot: AccountSnapshot } => r.ok).map((r) => r.snapshot);
  const errors = results.filter((r): r is { ok: false; error: { accountId: string; exchange: Exchange; label: string; message: string } } => !r.ok);

  const value = {
    snapshots,
    errors: errors.map((e) => e.error),
  };
  if (ttlMs > 0) cache.set(cacheKey, { expiresAt: Date.now() + ttlMs, value });

  return value;
}

