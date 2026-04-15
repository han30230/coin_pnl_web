import { z } from "zod";
import { ExchangeSchema } from "@/server/exchanges/common";

export const RangePresetSchema = z.enum(["7d", "30d", "90d", "all", "custom"]);
export type RangePreset = z.infer<typeof RangePresetSchema>;

export const DashboardQuerySchema = z.object({
  exchange: z.union([ExchangeSchema, z.literal("all")]).default("all"),
  accountIds: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return [];
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  preset: RangePresetSchema.default("30d"),
  start: z.string().optional(), // ISO
  end: z.string().optional(), // ISO
});

export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;

export type DashboardAccountMeta = Readonly<{
  accountId: string;
  exchange: z.infer<typeof ExchangeSchema>;
  label: string;
  /** From BINANCE_STRATEGY / BYBIT_STRATEGY (+ _SUFFIX); optional. */
  strategy?: string;
}>;

export type SymbolPnlRow = Readonly<{
  symbol: string;
  pnl: number;
  tradeCount: number;
}>;

export type DashboardAnalytics = Readonly<{
  overall: {
    topWinningSymbols: SymbolPnlRow[];
    topLosingSymbols: SymbolPnlRow[];
  };
  byAccount: Array<{
    accountId: string;
    label: string;
    exchange: z.infer<typeof ExchangeSchema>;
    strategy?: string;
    totalPnl: number;
    winRatePct?: number;
    tradeCount: number;
    topWinningSymbols: SymbolPnlRow[];
    topLosingSymbols: SymbolPnlRow[];
  }>;
}>;

export type PnlSummary = Readonly<{
  totalPnl: number;
  totalReturnPct?: number;
  winRatePct?: number;
  tradeCount: number;
  lastTradeAt?: string;
}>;

export type DailyPnlPoint = Readonly<{
  day: string; // YYYY-MM-DD in UTC
  pnl: number;
}>;

export type EquitySeriesPoint = Readonly<{
  ts: string; // ISO
  equity: number;
  cumPnl: number;
}>;

export type BreakdownRow = Readonly<{
  key: string; // exchange or accountId
  label: string;
  totalPnl: number;
  tradeCount: number;
  winRatePct?: number;
}>;

export type PerAccountChartBlock = Readonly<{
  accountId: string;
  label: string;
  exchange: z.infer<typeof ExchangeSchema>;
  dailyPnl: DailyPnlPoint[];
  equitySeries: EquitySeriesPoint[];
  dailySymbolBreakdown: Record<string, Array<{ symbol: string; pnl: number }>>;
}>;

export type DashboardResponse = Readonly<{
  updatedAt: string;
  query: DashboardQuery;
  // All discovered accounts from env (for multi-select UI)
  allAccounts: DashboardAccountMeta[];
  // Accounts actually included in this response (after filters)
  accounts: DashboardAccountMeta[];
  summary: PnlSummary;
  equitySeries: EquitySeriesPoint[];
  dailyPnl: DailyPnlPoint[];
  // For tooltip: day -> top symbol contributions (sorted by abs(pnl))
  dailySymbolBreakdown: Record<string, Array<{ symbol: string; pnl: number }>>;
  /** When multiple accounts are in scope, same charts broken down per account (for analysis). */
  perAccountCharts: PerAccountChartBlock[];
  analytics: DashboardAnalytics;
  breakdown: {
    byExchange: BreakdownRow[];
    byAccount: BreakdownRow[];
  };
  trades: Array<{
    tradeId: string;
    executedAt: string;
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
    entryPrice?: number;
    exitPrice?: number;
    realizedPnl: number;
    exchange: z.infer<typeof ExchangeSchema>;
    accountId: string;
    accountLabel: string;
  }>;
  errors: Array<{
    accountId: string;
    exchange: z.infer<typeof ExchangeSchema>;
    label: string;
    message: string;
  }>;
}>;

