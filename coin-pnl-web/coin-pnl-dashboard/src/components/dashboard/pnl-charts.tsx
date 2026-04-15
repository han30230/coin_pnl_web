"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyPnlPoint, EquitySeriesPoint } from "@/server/portfolio/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUsd } from "@/components/format/number";
import { cn } from "@/lib/utils";

function DailyTooltip({
  active,
  payload,
  label,
  symbolBreakdown,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  symbolBreakdown: Record<string, Array<{ symbol: string; pnl: number }>>;
}) {
  if (!active || !label) return null;
  const pnl = payload?.[0]?.value ?? 0;
  const rows = symbolBreakdown[label] ?? [];
  return (
    <div className="rounded-xl border bg-popover/95 px-3 py-2.5 text-popover-foreground shadow-lg backdrop-blur-sm">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm font-semibold tabular-nums", pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
        {formatUsd(typeof pnl === "number" ? pnl : Number(pnl))}
      </div>
      {rows.length > 0 ? (
        <div className="mt-2 space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Top symbols</div>
          {rows.map((r) => (
            <div key={r.symbol} className="flex items-center justify-between gap-6 text-xs tabular-nums">
              <span className="text-muted-foreground">{r.symbol}</span>
              <span className={r.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}>{formatUsd(r.pnl)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const POS = "hsl(142.1 70.6% 42%)";
const NEG = "hsl(350 70% 52%)";

export function PnlCharts({
  dailyPnl,
  equitySeries,
  dailySymbolBreakdown,
}: {
  dailyPnl: DailyPnlPoint[];
  equitySeries: EquitySeriesPoint[];
  dailySymbolBreakdown: Record<string, Array<{ symbol: string; pnl: number }>>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="overflow-hidden border-border/80 bg-card/80 shadow-sm ring-1 ring-foreground/[0.04] backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">일별 PnL</CardTitle>
          <CardDescription>선택한 기간·계정의 일별 실현 손익입니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[min(22rem,55vh)] pb-2">
          {dailyPnl.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPnl} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.12} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} minTickGap={24} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  width={56}
                  tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                />
                <ReTooltip content={<DailyTooltip symbolBreakdown={dailySymbolBreakdown} />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {dailyPnl.map((p) => (
                    <Cell key={p.day} fill={p.pnl >= 0 ? POS : NEG} fillOpacity={0.92} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 bg-card/80 shadow-sm ring-1 ring-foreground/[0.04] backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">누적 실현 PnL · 에쿼티</CardTitle>
          <CardDescription>초록: 누적 손익, 파랑: 추정 에쿼티 (거래소 잔고 기준).</CardDescription>
        </CardHeader>
        <CardContent className="h-[min(22rem,55vh)] pb-2">
          {equitySeries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equitySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.12} />
                <XAxis dataKey="ts" tick={{ fontSize: 11 }} minTickGap={24} hide stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  width={56}
                  tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                />
                <ReTooltip
                  formatter={(v, name) => [
                    typeof v === "number" ? formatUsd(v) : String(v),
                    name === "cumPnl" ? "누적 PnL" : name === "equity" ? "에쿼티" : String(name),
                  ]}
                />
                <Line type="monotone" dataKey="cumPnl" name="cumPnl" stroke={POS} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="equity" name="equity" stroke="hsl(217.2 91.2% 56%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
