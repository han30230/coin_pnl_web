import type { AccountSnapshot, NormalizedTrade } from "@/server/exchanges/common";
import { sumPnl, tradeWinRatePct, lastTradeAt } from "./metrics";
import { toUtcDayKey } from "./time";
import type {
  DashboardAnalytics,
  DashboardResponse,
  DashboardQuery,
  DailyPnlPoint,
  EquitySeriesPoint,
  PerAccountChartBlock,
  SymbolPnlRow,
} from "./types";

function isoFromDayKeyUtc(day: string) {
  return `${day}T00:00:00.000Z`;
}

function aggregateDailyFromTrades(trades: NormalizedTrade[]) {
  const dailyMap = new Map<string, number>();
  const dailySymbolMap = new Map<string, Map<string, number>>();
  for (const t of trades) {
    const key = toUtcDayKey(new Date(t.executedAt));
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + t.realizedPnl);

    let sym = dailySymbolMap.get(key);
    if (!sym) {
      sym = new Map<string, number>();
      dailySymbolMap.set(key, sym);
    }
    sym.set(t.symbol, (sym.get(t.symbol) ?? 0) + t.realizedPnl);
  }
  const dailyPnl: DailyPnlPoint[] = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, pnl]) => ({ day, pnl }));

  const dailySymbolBreakdown: Record<string, Array<{ symbol: string; pnl: number }>> = {};
  for (const [day, symMap] of dailySymbolMap.entries()) {
    dailySymbolBreakdown[day] = [...symMap.entries()]
      .map(([symbol, pnl]) => ({ symbol, pnl }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 8);
  }

  return { dailyPnl, dailySymbolBreakdown };
}

function buildEquitySeriesFromDaily(args: {
  dailyPnl: DailyPnlPoint[];
  totalPnl: number;
  currentEquity: number;
  nowIso: string;
}): EquitySeriesPoint[] {
  const { dailyPnl, totalPnl, currentEquity, nowIso } = args;
  if (dailyPnl.length === 0) return [{ ts: nowIso, equity: currentEquity, cumPnl: 0 }];
  let cum = 0;
  return dailyPnl.map((p) => {
    cum += p.pnl;
    const equity = currentEquity - (totalPnl - cum);
    return { ts: isoFromDayKeyUtc(p.day), equity, cumPnl: cum };
  });
}

function portfolioReturnPct(totalPnl: number, currentEquitySum: number): number | undefined {
  const startApprox = currentEquitySum - totalPnl;
  if (!Number.isFinite(startApprox) || startApprox <= 0) {
    if (totalPnl === 0) return 0;
    return undefined;
  }
  return (totalPnl / startApprox) * 100;
}

function aggregateSymbolPnl(trades: NormalizedTrade[]): SymbolPnlRow[] {
  const m = new Map<string, { pnl: number; tradeCount: number }>();
  for (const t of trades) {
    const cur = m.get(t.symbol) ?? { pnl: 0, tradeCount: 0 };
    cur.pnl += Number.isFinite(t.realizedPnl) ? t.realizedPnl : 0;
    cur.tradeCount += 1;
    m.set(t.symbol, cur);
  }
  return [...m.entries()].map(([symbol, v]) => ({ symbol, pnl: v.pnl, tradeCount: v.tradeCount }));
}

function splitWinnersLosers(rows: SymbolPnlRow[], topN: number) {
  const topWinningSymbols = rows.filter((r) => r.pnl > 0).sort((a, b) => b.pnl - a.pnl).slice(0, topN);
  const topLosingSymbols = rows.filter((r) => r.pnl < 0).sort((a, b) => a.pnl - b.pnl).slice(0, topN);
  return { topWinningSymbols, topLosingSymbols };
}

function computeDashboardAnalytics(
  trades: NormalizedTrade[],
  snapshots: AccountSnapshot[],
  strategyByAccountId: Map<string, string | undefined>,
): DashboardAnalytics {
  const overallRows = aggregateSymbolPnl(trades);
  const overall = splitWinnersLosers(overallRows, 15);

  const byAccount = snapshots.map((s) => {
    const aTrades = trades.filter((t) => t.accountId === s.accountId);
    const rows = aggregateSymbolPnl(aTrades);
    const { topWinningSymbols, topLosingSymbols } = splitWinnersLosers(rows, 10);
    return {
      accountId: s.accountId,
      label: s.label,
      exchange: s.exchange,
      strategy: strategyByAccountId.get(s.accountId),
      totalPnl: sumPnl(aTrades),
      winRatePct: tradeWinRatePct(aTrades),
      tradeCount: aTrades.length,
      topWinningSymbols,
      topLosingSymbols,
    };
  });

  return { overall, byAccount };
}

function perAccountBlock(s: AccountSnapshot, nowIso: string): PerAccountChartBlock {
  const trades = s.trades;
  const { dailyPnl, dailySymbolBreakdown } = aggregateDailyFromTrades(trades);
  const totalPnl = sumPnl(trades);
  const currentEquity = s.equitySeries?.[0]?.equity ?? 0;
  const equitySeries = buildEquitySeriesFromDaily({
    dailyPnl,
    totalPnl,
    currentEquity,
    nowIso,
  });
  return {
    accountId: s.accountId,
    label: s.label,
    exchange: s.exchange,
    dailyPnl,
    equitySeries,
    dailySymbolBreakdown,
  };
}

export function normalizeDashboard(args: {
  query: DashboardQuery;
  allAccounts: Array<{ accountId: string; exchange: "binance" | "bybit"; label: string; strategy?: string }>;
  snapshots: AccountSnapshot[];
  errors: Array<{ accountId: string; exchange: "binance" | "bybit"; label: string; message: string }>;
}): DashboardResponse {
  const strategyByAccountId = new Map<string, string | undefined>(
    args.allAccounts.map((a) => [a.accountId, a.strategy]),
  );

  const accountLabelById = new Map<string, string>();
  for (const s of args.snapshots) accountLabelById.set(s.accountId, s.label);

  const trades = args.snapshots.flatMap((s) => s.trades);
  const sortedTrades = [...trades].sort((a, b) => Date.parse(b.executedAt) - Date.parse(a.executedAt));

  const { dailyPnl, dailySymbolBreakdown } = aggregateDailyFromTrades(trades);

  const totalPnl = sumPnl(trades);
  const winRatePct = tradeWinRatePct(trades);
  const lastAt = lastTradeAt(trades);

  const byExchange = ["binance", "bybit"].map((ex) => {
    const exTrades = trades.filter((t) => t.exchange === ex);
    return {
      key: ex,
      label: ex === "binance" ? "Binance" : "Bybit",
      totalPnl: sumPnl(exTrades),
      tradeCount: exTrades.length,
      winRatePct: tradeWinRatePct(exTrades),
    };
  });

  const byAccount = args.snapshots.map((s) => {
    const aTrades = trades.filter((t) => t.accountId === s.accountId);
    return {
      key: s.accountId,
      label: s.label,
      totalPnl: sumPnl(aTrades),
      tradeCount: aTrades.length,
      winRatePct: tradeWinRatePct(aTrades),
    };
  });

  const nowIso = new Date().toISOString();
  const currentEquity = args.snapshots.reduce((acc, s) => acc + (s.equitySeries?.[0]?.equity ?? 0), 0);
  const totalReturnPct = portfolioReturnPct(totalPnl, currentEquity);

  const equitySeries = buildEquitySeriesFromDaily({
    dailyPnl,
    totalPnl,
    currentEquity,
    nowIso,
  });

  const perAccountCharts = args.snapshots.map((s) => perAccountBlock(s, nowIso));

  const analytics = computeDashboardAnalytics(trades, args.snapshots, strategyByAccountId);

  return {
    updatedAt: nowIso,
    query: args.query,
    allAccounts: args.allAccounts,
    accounts: args.snapshots.map((s) => ({
      accountId: s.accountId,
      exchange: s.exchange,
      label: s.label,
      strategy: strategyByAccountId.get(s.accountId),
    })),
    summary: {
      totalPnl,
      totalReturnPct,
      winRatePct,
      tradeCount: trades.length,
      lastTradeAt: lastAt,
    },
    equitySeries,
    dailyPnl,
    dailySymbolBreakdown,
    perAccountCharts,
    analytics,
    breakdown: {
      byExchange,
      byAccount,
    },
    trades: sortedTrades.map((t) => ({
      tradeId: t.tradeId,
      executedAt: t.executedAt,
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      realizedPnl: t.realizedPnl,
      exchange: t.exchange,
      accountId: t.accountId,
      accountLabel: accountLabelById.get(t.accountId) ?? t.accountId,
    })),
    errors: args.errors.map((e) => ({
      accountId: e.accountId,
      exchange: e.exchange,
      label: e.label,
      message: e.message,
    })),
  };
}
