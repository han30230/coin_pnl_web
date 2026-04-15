import type { NormalizedTrade } from "@/server/exchanges/common";

export function sumPnl(trades: NormalizedTrade[]) {
  return trades.reduce((acc, t) => acc + (Number.isFinite(t.realizedPnl) ? t.realizedPnl : 0), 0);
}

export function tradeWinRatePct(trades: NormalizedTrade[]) {
  const closed = trades.filter((t) => Number.isFinite(t.realizedPnl));
  if (closed.length === 0) return undefined;
  const wins = closed.filter((t) => t.realizedPnl > 0).length;
  return (wins / closed.length) * 100;
}

export function lastTradeAt(trades: NormalizedTrade[]) {
  if (trades.length === 0) return undefined;
  let max = 0;
  for (const t of trades) {
    const ms = Date.parse(t.executedAt);
    if (Number.isFinite(ms)) max = Math.max(max, ms);
  }
  return max ? new Date(max).toISOString() : undefined;
}

export function mddFromEquitySeries(points: Array<{ equity: number }>) {
  // Returns max drawdown as a fraction (0..1). Undefined if insufficient data.
  if (points.length < 2) return undefined;
  let peak = points[0]!.equity;
  let mdd = 0;
  for (const p of points) {
    if (p.equity > peak) peak = p.equity;
    if (peak > 0) {
      const dd = (peak - p.equity) / peak;
      if (dd > mdd) mdd = dd;
    }
  }
  return mdd;
}

