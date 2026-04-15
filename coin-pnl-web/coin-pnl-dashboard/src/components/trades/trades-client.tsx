"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse } from "@/server/portfolio/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUsd } from "@/components/format/number";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardRangeToolbar } from "@/components/dashboard/dashboard-range-toolbar";
import {
  buildDashboardFetchUrl,
  dashboardQueryKey,
  defaultCustomDateStrings,
  type DashboardQueryState,
} from "@/lib/dashboard-query";
import { downloadTradesCsv } from "@/lib/export-csv";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

function visiblePageNumbers(current: number, total: number): number[] {
  if (total <= 0) return [];
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set<number>();
  s.add(1);
  s.add(total);
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) s.add(i);
  }
  return [...s].sort((a, b) => a - b);
}

export function TradesClient() {
  const [query, setQuery] = React.useState<DashboardQueryState>(() => ({
    preset: "90d",
    exchange: "all",
    accountIds: [],
    ...defaultCustomDateStrings(),
  }));
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const api = useQuery({
    queryKey: dashboardQueryKey("dashboard-trades", query),
    queryFn: async () => {
      const res = await fetch(buildDashboardFetchUrl(window.location.origin, query), { cache: "no-store" });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return (await res.json()) as DashboardResponse;
    },
    refetchInterval: 30_000,
  });

  const filtered = React.useMemo(() => {
    if (!api.data) return [];
    const needle = search.trim().toLowerCase();
    return api.data.trades.filter((t) => {
      if (!needle) return true;
      return (
        t.symbol.toLowerCase().includes(needle) ||
        t.accountLabel.toLowerCase().includes(needle) ||
        t.exchange.toLowerCase().includes(needle)
      );
    });
  }, [api.data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  React.useEffect(() => {
    setPage(1);
  }, [query, search]);

  React.useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  if (api.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (api.isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">오류</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {api.error instanceof Error ? api.error.message : "Unknown error"}
        </CardContent>
      </Card>
    );
  }

  const data = api.data;
  if (!data) return null;

  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(offset, offset + PAGE_SIZE);
  const pageNums = visiblePageNumbers(safePage, totalPages);

  const exportFilename = `trades_${query.preset}_${new Date().toISOString().slice(0, 10)}`;

  return (
    <div className="flex flex-col gap-4">
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

      <Card className="border-border/80 shadow-sm ring-1 ring-foreground/[0.04]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">체결 목록</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="심볼 · 계정 · 거래소 검색"
              className="max-w-md rounded-xl border-border/80"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                총 <span className="font-semibold tabular-nums text-foreground">{filtered.length}</span>건
                {search.trim() ? " (검색 적용)" : ""}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-border/80 font-semibold shadow-sm"
                disabled={filtered.length === 0}
                onClick={() =>
                  downloadTradesCsv(
                    exportFilename,
                    filtered.map((t) => ({
                      executedAt: t.executedAt,
                      symbol: t.symbol,
                      side: t.side,
                      quantity: t.quantity,
                      entryPrice: t.entryPrice,
                      exitPrice: t.exitPrice,
                      realizedPnl: t.realizedPnl,
                      exchange: t.exchange,
                      accountLabel: t.accountLabel,
                    })),
                  )
                }
              >
                <Download className="size-4" />
                엑셀(CSV) 받기
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>심볼</TableHead>
                  <TableHead>방향</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right">진입</TableHead>
                  <TableHead className="text-right">청산</TableHead>
                  <TableHead className="text-right">실현 PnL</TableHead>
                  <TableHead>계정</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      조건에 맞는 체결이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((t) => (
                    <TableRow key={t.tradeId}>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                        {new Date(t.executedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{t.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t.side.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.entryPrice ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.exitPrice ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatUsd(t.realizedPnl)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.accountLabel} · {t.exchange}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-xs text-muted-foreground">
                페이지당 {PAGE_SIZE}건 · {offset + 1}–{Math.min(offset + PAGE_SIZE, filtered.length)} 표시
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-lg"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="이전 페이지"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {pageNums.map((n, idx) => (
                  <React.Fragment key={n}>
                    {idx > 0 && pageNums[idx]! - pageNums[idx - 1]! > 1 ? (
                      <span className="px-1 text-muted-foreground">…</span>
                    ) : null}
                    <Button
                      type="button"
                      variant={n === safePage ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "min-w-9 rounded-lg px-2 font-semibold tabular-nums",
                        n === safePage && "pointer-events-none shadow-md",
                      )}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  </React.Fragment>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-lg"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="다음 페이지"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
