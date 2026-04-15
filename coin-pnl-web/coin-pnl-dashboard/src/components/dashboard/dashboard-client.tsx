"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PnlCharts } from "@/components/dashboard/pnl-charts";
import { PnlChartsOverlay } from "@/components/dashboard/pnl-charts-overlay";
import { DashboardRangeToolbar } from "@/components/dashboard/dashboard-range-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardResponse } from "@/server/portfolio/types";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CheckCircle2, RefreshCw } from "lucide-react";
import {
  buildDashboardFetchUrl,
  dashboardQueryKey,
  defaultCustomDateStrings,
  type DashboardQueryState,
} from "@/lib/dashboard-query";

type ChartViewMode = "combined" | "overlay" | "perAccount";

export function DashboardClient() {
  const [query, setQuery] = React.useState<DashboardQueryState>(() => ({
    preset: "30d",
    exchange: "all",
    accountIds: [],
    ...defaultCustomDateStrings(),
  }));
  const [chartView, setChartView] = React.useState<ChartViewMode>("combined");

  const q = useQuery({
    queryKey: dashboardQueryKey("dashboard-main", query),
    queryFn: async () => {
      const res = await fetch(buildDashboardFetchUrl(window.location.origin, query), { cache: "no-store" });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as DashboardResponse;
    },
    refetchInterval: 20_000,
  });

  const data = q.data;

  React.useEffect(() => {
    if (data && data.accounts.length <= 1 && chartView !== "combined") {
      setChartView("combined");
    }
  }, [data?.accounts.length, chartView, data]);

  if (q.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">불러오기 실패</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{q.error instanceof Error ? q.error.message : "Unknown error"}</p>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            onClick={() => q.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const multiAccount = data.accounts.length > 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card/95 via-card/80 to-muted/25 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-white/[0.06] backdrop-blur-md dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <DashboardRangeToolbar
            value={query}
            onChange={setQuery}
            allAccounts={data.allAccounts.map((a) => ({
              accountId: a.accountId,
              label: a.label,
              exchange: a.exchange,
            }))}
          />

          <div className="flex flex-shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Badge variant="secondary" className="justify-center tabular-nums sm:justify-end">
              갱신 {new Date(data.updatedAt).toLocaleTimeString()}
            </Badge>
            {data.errors.length > 0 ? (
              <Badge variant="destructive" className="justify-center sm:justify-end">
                오류 {data.errors.length}건
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 justify-center bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 sm:justify-end">
                <CheckCircle2 className="h-3.5 w-3.5" />
                모든 계정 정상
              </Badge>
            )}
          </div>
        </div>
      </div>

      <KpiCards summary={data.summary} />

      {multiAccount ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">차트 보기</p>
            <p className="text-xs text-muted-foreground">합산·겹침·분리 중 선택해 비교 방식을 바꿀 수 있습니다.</p>
          </div>
          <SegmentedControl
            size="lg"
            value={chartView}
            onChange={setChartView}
            options={[
              { id: "combined", label: "합산" },
              { id: "overlay", label: "겹쳐보기" },
              { id: "perAccount", label: "계정별" },
            ]}
          />
        </div>
      ) : null}

      {multiAccount && chartView === "overlay" ? (
        <PnlChartsOverlay
          perAccountCharts={data.perAccountCharts}
          combinedDailyPnl={data.dailyPnl}
          combinedEquitySeries={data.equitySeries}
        />
      ) : null}

      {!multiAccount || chartView === "combined" ? (
        <PnlCharts dailyPnl={data.dailyPnl} equitySeries={data.equitySeries} dailySymbolBreakdown={data.dailySymbolBreakdown} />
      ) : null}

      {multiAccount && chartView === "perAccount" ? (
        <div className="flex flex-col gap-10">
          {data.perAccountCharts.map((b) => (
            <section key={b.accountId} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
                <h2 className="text-lg font-semibold tracking-tight">{b.label}</h2>
                <Badge variant="outline" className="uppercase">
                  {b.exchange}
                </Badge>
              </div>
              <PnlCharts dailyPnl={b.dailyPnl} equitySeries={b.equitySeries} dailySymbolBreakdown={b.dailySymbolBreakdown} />
            </section>
          ))}
        </div>
      ) : null}

      {data.errors.length > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">일부 계정만 실패</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {data.errors.map((e) => (
              <div key={e.accountId} className="flex flex-wrap items-start gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2">
                <Badge variant="destructive">{e.label}</Badge>
                <span className="min-w-0 flex-1 text-muted-foreground">{e.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
