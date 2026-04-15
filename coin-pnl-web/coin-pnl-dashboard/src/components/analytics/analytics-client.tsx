"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse, SymbolPnlRow } from "@/server/portfolio/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mddFromEquitySeries } from "@/server/portfolio/metrics";
import { formatPct, formatUsd } from "@/components/format/number";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DashboardRangeToolbar } from "@/components/dashboard/dashboard-range-toolbar";
import {
  buildDashboardFetchUrl,
  dashboardQueryKey,
  defaultCustomDateStrings,
  type DashboardQueryState,
} from "@/lib/dashboard-query";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

function SymbolTable({
  title,
  rows,
  variant,
}: {
  title: string;
  rows: SymbolPnlRow[];
  variant: "win" | "loss";
}) {
  const empty = rows.length === 0;
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background/50">
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border/60 px-3 py-2.5",
          variant === "win" ? "bg-emerald-500/8" : "bg-rose-500/8",
        )}
      >
        {variant === "win" ? (
          <TrendingUp className="size-4 text-emerald-500" aria-hidden />
        ) : (
          <TrendingDown className="size-4 text-rose-500" aria-hidden />
        )}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {empty ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">해당 구간에 데이터가 없습니다.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">심볼</TableHead>
              <TableHead className="text-right">실현 손익</TableHead>
              <TableHead className="text-right">체결 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.symbol}>
                <TableCell className="font-medium">{r.symbol}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-medium",
                    r.pnl >= 0 ? "text-emerald-500" : "text-rose-500",
                  )}
                >
                  {formatUsd(r.pnl)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{r.tradeCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function AnalyticsClient() {
  const [query, setQuery] = React.useState<DashboardQueryState>(() => ({
    preset: "90d",
    exchange: "all",
    accountIds: [],
    ...defaultCustomDateStrings(),
  }));

  const api = useQuery({
    queryKey: dashboardQueryKey("dashboard-analytics", query),
    queryFn: async () => {
      const res = await fetch(buildDashboardFetchUrl(window.location.origin, query), { cache: "no-store" });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as DashboardResponse;
    },
    refetchInterval: 30_000,
  });

  if (api.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (api.isError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">오류</CardTitle>
          <CardDescription>{api.error instanceof Error ? api.error.message : "Unknown error"}</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
            onClick={() => api.refetch()}
          >
            <RefreshCw className="size-4" />
            다시 시도
          </button>
        </CardContent>
      </Card>
    );
  }

  const data = api.data;
  if (!data) return null;

  const mdd = mddFromEquitySeries(data.equitySeries);
  const sortedByPnl = [...data.trades].sort((a, b) => b.realizedPnl - a.realizedPnl);
  const best = sortedByPnl[0];
  const worst =
    data.trades.length > 0
      ? [...data.trades].sort((a, b) => a.realizedPnl - b.realizedPnl)[0]
      : undefined;

  const { overall, byAccount } = data.analytics;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">분석</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          선택한 기간의 합산 데이터로 심볼·계정별 손익을 봅니다. 계정 메모(전략)는{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">BINANCE_STRATEGY</code> 등 환경 변수로 설정할 수
          있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card/95 via-card/80 to-muted/25 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-white/[0.06] md:p-5">
        <DashboardRangeToolbar
          value={query}
          onChange={setQuery}
          allAccounts={data.allAccounts.map((a) => ({
            accountId: a.accountId,
            label: a.label,
            exchange: a.exchange,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 bg-card/90 shadow-sm ring-1 ring-foreground/[0.04]">
          <CardHeader className="pb-2">
            <CardDescription>합산 실현 PnL</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl tabular-nums",
                data.summary.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500",
              )}
            >
              {formatUsd(data.summary.totalPnl)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 bg-card/90 shadow-sm ring-1 ring-foreground/[0.04]">
          <CardHeader className="pb-2">
            <CardDescription>승률</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatPct(data.summary.winRatePct)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 bg-card/90 shadow-sm ring-1 ring-foreground/[0.04]">
          <CardHeader className="pb-2">
            <CardDescription>MDD (에쿼티 기준)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{mdd === undefined ? "—" : formatPct(mdd * 100)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 bg-card/90 shadow-sm ring-1 ring-foreground/[0.04]">
          <CardHeader className="pb-2">
            <CardDescription>체결 수</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{data.summary.tradeCount.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SymbolTable title="심볼별 — 이익이 큰 순 (전체 합산)" rows={overall.topWinningSymbols} variant="win" />
        <SymbolTable title="심볼별 — 손실이 큰 순 (전체 합산)" rows={overall.topLosingSymbols} variant="loss" />
      </div>

      <Card className="border-border/80 bg-card/90 shadow-sm ring-1 ring-foreground/[0.04]">
        <CardHeader>
          <CardTitle className="text-base">단일 체결 기준 베스트 / 워스트</CardTitle>
          <CardDescription>선택 구간에서 실현 손익이 가장 크게 난 체결 한 건씩입니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-emerald-500/5 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best trade</div>
            {best ? (
              <div className="mt-2 space-y-1">
                <div className="text-lg font-semibold">{best.symbol}</div>
                <div className="text-xs text-muted-foreground">
                  {best.accountLabel} · {best.exchange}
                </div>
                <div className="text-xl font-bold tabular-nums text-emerald-500">{formatUsd(best.realizedPnl)}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">없음</div>
            )}
          </div>
          <div className="rounded-xl border border-border/70 bg-rose-500/5 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Worst trade</div>
            {worst ? (
              <div className="mt-2 space-y-1">
                <div className="text-lg font-semibold">{worst.symbol}</div>
                <div className="text-xs text-muted-foreground">
                  {worst.accountLabel} · {worst.exchange}
                </div>
                <div className="text-xl font-bold tabular-nums text-rose-500">{formatUsd(worst.realizedPnl)}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">없음</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">계정별</h2>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {byAccount.map((acc) => (
            <Card
              key={acc.accountId}
              className="border-border/80 bg-gradient-to-b from-card/95 to-muted/15 shadow-md ring-1 ring-foreground/[0.04]"
            >
              <CardHeader className="space-y-3 border-b border-border/60 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{acc.label}</CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="uppercase">
                        {acc.exchange}
                      </Badge>
                      {acc.strategy ? (
                        <Badge className="bg-primary/15 font-normal text-primary hover:bg-primary/20">전략: {acc.strategy}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          전략 메모 없음 — <code className="rounded bg-muted px-1 text-[10px]">BINANCE_STRATEGY</code> 등 설정
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        acc.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500",
                      )}
                    >
                      {formatUsd(acc.totalPnl)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      승률 {formatPct(acc.winRatePct)} · 체결 {acc.tradeCount.toLocaleString()}건
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
                <SymbolTable title="이익 심볼" rows={acc.topWinningSymbols} variant="win" />
                <SymbolTable title="손실 심볼" rows={acc.topLosingSymbols} variant="loss" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
