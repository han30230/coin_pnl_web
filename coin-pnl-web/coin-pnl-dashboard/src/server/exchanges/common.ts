import { z } from "zod";

export const ExchangeSchema = z.enum(["binance", "bybit"]);
export type Exchange = z.infer<typeof ExchangeSchema>;

export type TimeRange = Readonly<{
  startMs: number; // inclusive
  endMs: number; // exclusive
}>;

export type AdapterError = Readonly<{
  accountId: string;
  exchange: Exchange;
  message: string;
  retryable: boolean;
}>;

export type NormalizedTrade = Readonly<{
  tradeId: string;
  accountId: string;
  exchange: Exchange;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  entryPrice?: number;
  exitPrice?: number;
  realizedPnl: number;
  fee?: number;
  feeAsset?: string;
  executedAt: string; // ISO
}>;

export type EquityPoint = Readonly<{
  ts: string; // ISO
  equity: number; // quote currency normalized (best-effort)
}>;

export type AccountSnapshot = Readonly<{
  accountId: string;
  exchange: Exchange;
  label: string;
  lastUpdatedAt: string; // ISO
  trades: NormalizedTrade[];
  equitySeries?: EquityPoint[];
}>;

export interface ExchangeAdapter {
  readonly exchange: Exchange;
  fetchAccountSnapshot(args: {
    accountId: string;
    label: string;
    apiKey: string;
    apiSecret: string;
    range: TimeRange;
    timeoutMs: number;
  }): Promise<AccountSnapshot>;
}

