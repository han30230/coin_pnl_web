"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse } from "@/server/portfolio/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mddFromEquitySeries } from "@/server/portfolio/metrics";
import { formatPct, formatUsd } from "@/components/format/number";

function buildUrl() {
  const u = new URL("/api/dashboard", window.location.origin);
  u.searchParams.set("preset", "all");
  u.searchParams.set("exchange", "all");
  return u.toString();
}

export function AnalyticsClient() {
  const api = useQuery({
    queryKey: ["dashboard", "analytics", "all"],
    queryFn: async () => {
      const res = await fetch(buildUrl(), { cache: "no-store" });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as DashboardResponse;
    },
    refetchInterval: 30_000,
  });

  if (api.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (api.isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Error</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {api.error instanceof Error ? api.error.message : "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  const data = api.data;
  if (!data) return null;

  const mdd = mddFromEquitySeries(data.equitySeries);
  const best = [...data.trades].sort((a, b) => b.realizedPnl - a.realizedPnl)[0];
  const worst = [...data.trades].sort((a, b) => a.realizedPnl - b.realizedPnl)[0];

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Key stats</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total PnL</span>
            <span className="tabular-nums">{formatUsd(data.summary.totalPnl)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Win rate</span>
            <span className="tabular-nums">{formatPct(data.summary.winRatePct)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">MDD</span>
            <span className="tabular-nums">{mdd === undefined ? "—" : formatPct(mdd * 100)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Best / Worst trades</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Best</div>
            {best ? (
              <div className="mt-1 flex flex-col gap-1">
                <div className="text-sm font-medium">{best.symbol}</div>
                <div className="text-xs text-muted-foreground">{best.accountLabel} · {best.exchange}</div>
                <div className="text-lg font-semibold tabular-nums text-emerald-400">{formatUsd(best.realizedPnl)}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">No trades</div>
            )}
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Worst</div>
            {worst ? (
              <div className="mt-1 flex flex-col gap-1">
                <div className="text-sm font-medium">{worst.symbol}</div>
                <div className="text-xs text-muted-foreground">{worst.accountLabel} · {worst.exchange}</div>
                <div className="text-lg font-semibold tabular-nums text-rose-400">{formatUsd(worst.realizedPnl)}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">No trades</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

