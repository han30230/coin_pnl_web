import type { AccountSnapshot } from "@/server/exchanges/common";
import { sumPnl, tradeWinRatePct, lastTradeAt } from "./metrics";
import { toUtcDayKey } from "./time";
import type { DashboardResponse, DashboardQuery } from "./types";

function isoFromDayKeyUtc(day: string) {
  // day: YYYY-MM-DD
  return `${day}T00:00:00.000Z`;
}

export function normalizeDashboard(args: {
  query: DashboardQuery;
  allAccounts: Array<{ accountId: string; exchange: "binance" | "bybit"; label: string }>;
  snapshots: AccountSnapshot[];
  errors: Array<{ accountId: string; exchange: "binance" | "bybit"; label: string; message: string }>;
}): DashboardResponse {
  const accountLabelById = new Map<string, string>();
  for (const s of args.snapshots) accountLabelById.set(s.accountId, s.label);

  const trades = args.snapshots.flatMap((s) => s.trades);
  const sortedTrades = [...trades].sort((a, b) => Date.parse(b.executedAt) - Date.parse(a.executedAt));

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
  const dailyPnl = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, pnl]) => ({ day, pnl }));

  const dailySymbolBreakdown: DashboardResponse["dailySymbolBreakdown"] = {};
  for (const [day, symMap] of dailySymbolMap.entries()) {
    dailySymbolBreakdown[day] = [...symMap.entries()]
      .map(([symbol, pnl]) => ({ symbol, pnl }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 8);
  }

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

  // Equity series: best-effort.
  // We often only have "current equity" from exchanges. To still show a meaningful curve,
  // we backfill an equity-like series using cumulative realized PnL over the selected range:
  // equity(t) ~= currentEquity - (totalPnl - cumPnl(t)).
  const nowIso = new Date().toISOString();
  const currentEquity = args.snapshots.reduce((acc, s) => acc + (s.equitySeries?.[0]?.equity ?? 0), 0);

  let cum = 0;
  const equitySeries =
    dailyPnl.length > 0
      ? dailyPnl.map((p) => {
          cum += p.pnl;
          const equity = currentEquity - (totalPnl - cum);
          return { ts: isoFromDayKeyUtc(p.day), equity, cumPnl: cum };
        })
      : [{ ts: nowIso, equity: currentEquity, cumPnl: 0 }];

  return {
    updatedAt: nowIso,
    query: args.query,
    allAccounts: args.allAccounts,
    accounts: args.snapshots.map((s) => ({ accountId: s.accountId, exchange: s.exchange, label: s.label })),
    summary: {
      totalPnl,
      totalReturnPct: undefined,
      winRatePct,
      tradeCount: trades.length,
      lastTradeAt: lastAt,
    },
    equitySeries,
    dailyPnl,
    dailySymbolBreakdown,
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

