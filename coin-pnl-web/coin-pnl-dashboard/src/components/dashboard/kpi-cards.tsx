"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PnlSummary } from "@/server/portfolio/types";
import { formatPct, formatUsd } from "@/components/format/number";
import { cn } from "@/lib/utils";

export function KpiCards({ summary }: { summary: PnlSummary }) {
  const pnlPos = summary.totalPnl >= 0;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total PnL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-semibold tabular-nums", pnlPos ? "text-emerald-400" : "text-rose-400")}>
            {formatUsd(summary.totalPnl)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Realized only (read-only)</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">{formatPct(summary.winRatePct)}</div>
          <div className="mt-1 text-xs text-muted-foreground">By closed trades</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">{summary.tradeCount.toLocaleString()}</div>
          <div className="mt-1 text-xs text-muted-foreground">In selected range</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Last Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">{summary.lastTradeAt ? "Updated" : "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">{summary.lastTradeAt ?? "No trades yet"}</div>
        </CardContent>
      </Card>
    </div>
  );
}

