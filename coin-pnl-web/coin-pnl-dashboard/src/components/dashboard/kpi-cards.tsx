"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PnlSummary } from "@/server/portfolio/types";
import { formatPct, formatUsd } from "@/components/format/number";
import { cn } from "@/lib/utils";
import { Activity, DollarSign, Percent, Target } from "lucide-react";

const items = [
  {
    key: "pnl",
    title: "Total PnL",
    desc: "실현 손익 (읽기 전용)",
    accent: "border-l-emerald-500/80",
    icon: DollarSign,
    value: (s: PnlSummary) => formatUsd(s.totalPnl),
    valueClass: (s: PnlSummary) => (s.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"),
  },
  {
    key: "ret",
    title: "수익률",
    desc: "기간 대비 (시작 자산 추정)",
    accent: "border-l-sky-500/80",
    icon: Percent,
    value: (s: PnlSummary) => formatPct(s.totalReturnPct),
    valueClass: (s: PnlSummary) => {
      const r = s.totalReturnPct;
      if (r === undefined) return "";
      return r >= 0 ? "text-emerald-500" : "text-rose-500";
    },
  },
  {
    key: "win",
    title: "Win Rate",
    desc: "청산 거래 기준",
    accent: "border-l-violet-500/75",
    icon: Target,
    value: (s: PnlSummary) => formatPct(s.winRatePct),
    valueClass: () => "",
  },
  {
    key: "trades",
    title: "Trades",
    desc: "선택 구간 체결 수",
    accent: "border-l-amber-500/75",
    icon: Activity,
    value: (s: PnlSummary) => s.tradeCount.toLocaleString(),
    valueClass: () => "",
  },
] as const;

export function KpiCards({ summary }: { summary: PnlSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.key}
            className={cn(
              "overflow-hidden border-border/70 bg-card/90 shadow-sm ring-1 ring-foreground/[0.03] backdrop-blur-sm transition-shadow hover:shadow-md",
              "border-l-4",
              item.accent,
            )}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <CardDescription className="text-xs">{item.desc}</CardDescription>
              </div>
              <div className="rounded-lg bg-muted/80 p-2 text-muted-foreground ring-1 ring-foreground/5">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={cn("text-2xl font-semibold tabular-nums tracking-tight", item.valueClass(summary))}>
                {item.value(summary)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
