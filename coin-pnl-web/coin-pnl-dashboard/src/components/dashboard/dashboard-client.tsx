"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PnlCharts } from "@/components/dashboard/pnl-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardResponse } from "@/server/portfolio/types";
import { Badge } from "@/components/ui/badge";
import { AccountMultiSelect } from "@/components/dashboard/account-multi-select";

function buildUrl(params: { preset: string; exchange: string; accountIds: string[] }) {
  const u = new URL("/api/dashboard", window.location.origin);
  u.searchParams.set("preset", params.preset);
  u.searchParams.set("exchange", params.exchange);
  if (params.accountIds.length > 0) u.searchParams.set("accountIds", params.accountIds.join(","));
  return u.toString();
}

export function DashboardClient() {
  const [preset, setPreset] = React.useState<"7d" | "30d" | "90d" | "all">("30d");
  const [exchange, setExchange] = React.useState<"all" | "binance" | "bybit">("all");
  const [accountIds, setAccountIds] = React.useState<string[]>([]);

  const q = useQuery({
    queryKey: ["dashboard", preset, exchange, accountIds.slice().sort().join(",")],
    queryFn: async () => {
      const res = await fetch(buildUrl({ preset, exchange, accountIds }), { cache: "no-store" });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as DashboardResponse;
    },
    refetchInterval: 20_000,
  });

  if (q.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Error</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-sm">{q.error instanceof Error ? q.error.message : "Unknown error"}</div>
          <button
            className="w-fit rounded-md border px-3 py-2 text-sm hover:bg-muted"
            onClick={() => q.refetch()}
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const data = q.data;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`rounded-md border px-3 py-2 text-sm ${preset === "7d" ? "bg-muted" : "hover:bg-muted/60"}`}
          onClick={() => setPreset("7d")}
        >
          7D
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${preset === "30d" ? "bg-muted" : "hover:bg-muted/60"}`}
          onClick={() => setPreset("30d")}
        >
          30D
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${preset === "90d" ? "bg-muted" : "hover:bg-muted/60"}`}
          onClick={() => setPreset("90d")}
        >
          90D
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${preset === "all" ? "bg-muted" : "hover:bg-muted/60"}`}
          onClick={() => setPreset("all")}
        >
          ALL
        </button>

        <div className="mx-2 hidden h-6 w-px bg-border md:block" />

        <button
          className={`rounded-md border px-3 py-2 text-sm ${exchange === "all" ? "bg-muted" : "hover:bg-muted/60"}`}
          onClick={() => setExchange("all")}
        >
          All
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${exchange === "binance" ? "bg-muted" : "hover:bg-muted/60"}`}
          onClick={() => setExchange("binance")}
        >
          Binance
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${exchange === "bybit" ? "bg-muted" : "hover:bg-muted/60"}`}
          onClick={() => setExchange("bybit")}
        >
          Bybit
        </button>

        <AccountMultiSelect
          options={data.allAccounts.map((a) => ({ accountId: a.accountId, label: a.label, exchange: a.exchange }))}
          value={accountIds}
          onChange={setAccountIds}
        />

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="tabular-nums">
            Updated {new Date(data.updatedAt).toLocaleTimeString()}
          </Badge>
          {data.errors.length > 0 ? (
            <Badge variant="destructive">{data.errors.length} account errors</Badge>
          ) : (
            <Badge variant="secondary">All accounts OK</Badge>
          )}
        </div>
      </div>

      <KpiCards summary={data.summary} />
      <PnlCharts dailyPnl={data.dailyPnl} equitySeries={data.equitySeries} dailySymbolBreakdown={data.dailySymbolBreakdown} />

      {data.errors.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Partial failures</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {data.errors.map((e) => (
              <div key={e.accountId} className="flex flex-wrap items-center gap-2">
                <Badge variant="destructive">{e.label}</Badge>
                <span className="text-muted-foreground">{e.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

