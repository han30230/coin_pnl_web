"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse } from "@/server/portfolio/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUsd } from "@/components/format/number";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function buildUrl() {
  const u = new URL("/api/dashboard", window.location.origin);
  u.searchParams.set("preset", "90d");
  u.searchParams.set("exchange", "all");
  return u.toString();
}

export function TradesClient() {
  const [q, setQ] = React.useState("");

  const api = useQuery({
    queryKey: ["dashboard", "trades", "90d"],
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
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
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

  const needle = q.trim().toLowerCase();
  const rows = data.trades.filter((t) => {
    if (!needle) return true;
    return (
      t.symbol.toLowerCase().includes(needle) ||
      t.accountLabel.toLowerCase().includes(needle) ||
      t.exchange.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Trades</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search symbol / account / exchange" />
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead className="text-right">PnL</TableHead>
                  <TableHead>Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No matching trades
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.slice(0, 200).map((t) => (
                    <TableRow key={t.tradeId}>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {new Date(t.executedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{t.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t.side.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.entryPrice ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.exitPrice ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(t.realizedPnl)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.accountLabel} · {t.exchange}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing up to 200 most recent trades (range preset: 90d).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

