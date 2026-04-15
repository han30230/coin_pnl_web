import { z } from "zod";

export type Exchange = "binance" | "bybit";

export type ExchangeAccount = Readonly<{
  accountId: string;
  exchange: Exchange;
  label: string;
  /** Optional note shown in Analytics (e.g. strategy name). Set BINANCE_STRATEGY / BINANCE_STRATEGY_<SUFFIX>. */
  strategy?: string;
  apiKey: string;
  apiSecret: string;
}>;

const EnvSchema = z
  .record(z.string(), z.string().optional())
  .superRefine((env, ctx) => {
    const pairs = extractAccountPairs(env);
    if (pairs.length === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "No exchange accounts found. Set BINANCE_API_KEY/BINANCE_SECRET and/or BYBIT_API_KEY/BYBIT_SECRET (and optional *_<LABEL> variants).",
      });
    }
  });

type Pair = {
  exchange: Exchange;
  suffix: string; // "" | "JK" | "JK_2" ...
  apiKeyVar: string;
  apiSecretVar: string;
  apiKey?: string;
  apiSecret?: string;
};

const KEY_RE = /^(BINANCE|BYBIT)_API_KEY(?:_(.+))?$/;

function extractAccountPairs(env: Record<string, string | undefined>): Pair[] {
  const pairs: Pair[] = [];
  for (const [k, v] of Object.entries(env)) {
    const m = KEY_RE.exec(k);
    if (!m) continue;
    const ex = m[1] === "BINANCE" ? ("binance" as const) : ("bybit" as const);
    const suffix = (m[2] ?? "").trim();
    const apiKeyVar = k;
    const apiSecretVar =
      ex === "binance"
        ? suffix
          ? `BINANCE_SECRET_${suffix}`
          : "BINANCE_SECRET"
        : suffix
          ? `BYBIT_SECRET_${suffix}`
          : "BYBIT_SECRET";

    pairs.push({
      exchange: ex,
      suffix,
      apiKeyVar,
      apiSecretVar,
      apiKey: v,
      apiSecret: env[apiSecretVar],
    });
  }

  // de-dupe by exchange+suffix
  const seen = new Set<string>();
  return pairs.filter((p) => {
    const id = `${p.exchange}:${p.suffix}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function labelFromSuffix(exchange: Exchange, suffix: string) {
  if (!suffix) return exchange === "binance" ? "Binance" : "Bybit";
  return `${exchange === "binance" ? "Binance" : "Bybit"} (${suffix.replaceAll("_", " ")})`;
}

function accountIdFromSuffix(exchange: Exchange, suffix: string) {
  return `${exchange}:${suffix ? suffix.toLowerCase() : "default"}`;
}

function strategyFromSuffix(env: Record<string, string | undefined>, exchange: Exchange, suffix: string) {
  const prefix = exchange === "binance" ? "BINANCE" : "BYBIT";
  const key = suffix ? `${prefix}_STRATEGY_${suffix}` : `${prefix}_STRATEGY`;
  const v = env[key]?.trim();
  return v || undefined;
}

export function getExchangeAccountsFromEnv(
  env: Record<string, string | undefined> = process.env,
): ExchangeAccount[] {
  // Next.js runtime may provide a non-plain object for process.env.
  // Normalize to a plain record before validating.
  const plainEnv: Record<string, string | undefined> = env ? { ...env } : {};
  EnvSchema.parse(plainEnv);

  const pairs = extractAccountPairs(plainEnv);
  const accounts: ExchangeAccount[] = [];

  for (const p of pairs) {
    const apiKey = (p.apiKey ?? "").trim();
    const apiSecret = (p.apiSecret ?? "").trim();

    if (!apiKey || !apiSecret) {
      // Skip incomplete pairs; caller will still get other accounts.
      continue;
    }

    accounts.push({
      accountId: accountIdFromSuffix(p.exchange, p.suffix),
      exchange: p.exchange,
      label: labelFromSuffix(p.exchange, p.suffix),
      strategy: strategyFromSuffix(plainEnv, p.exchange, p.suffix),
      apiKey,
      apiSecret,
    });
  }

  return accounts;
}

