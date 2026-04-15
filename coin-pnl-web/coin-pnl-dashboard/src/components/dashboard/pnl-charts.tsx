"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm font-semibold tabular-nums", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
        {formatUsd(typeof pnl === "number" ? pnl : Number(pnl))}
      </div>
      {rows.length > 0 ? (
        <div className="mt-2 space-y-1">
          <div className="text-[11px] text-muted-foreground">Top symbols</div>
          {rows.map((r) => (
            <div key={r.symbol} className="flex items-center justify-between gap-6 text-xs tabular-nums">
              <span className="text-muted-foreground">{r.symbol}</span>
              <span className={r.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatUsd(r.pnl)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Daily PnL</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {dailyPnl.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPnl}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} minTickGap={24} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                />
                <ReTooltip content={<DailyTooltip symbolBreakdown={dailySymbolBreakdown} />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dailyPnl.map((p, idx) => (
                    <Cell
                      key={p.day}
                      fill={p.pnl >= 0 ? "hsl(142.1 70.6% 45.3%)" : "hsl(0 84.2% 60.2%)"}
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Cumulative PnL / Equity</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {equitySeries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equitySeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="ts" tick={{ fontSize: 12 }} minTickGap={24} hide />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                />
                <ReTooltip formatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))} />
                <Line type="monotone" dataKey="cumPnl" stroke="hsl(142.1 70.6% 45.3%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="equity" stroke="hsl(217.2 91.2% 59.8%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

