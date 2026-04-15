"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyPnlPoint, EquitySeriesPoint, PerAccountChartBlock } from "@/server/portfolio/types";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUsd } from "@/components/format/number";
import { strokeAt } from "@/components/dashboard/chart-series-colors";

function dayFromTs(ts: string) {
  return ts.slice(0, 10);
}

function mergeDailyOverlay(blocks: PerAccountChartBlock[], combined: DailyPnlPoint[]) {
  const daySet = new Set<string>();
  for (const b of blocks) {
    for (const p of b.dailyPnl) daySet.add(p.day);
  }
  for (const p of combined) daySet.add(p.day);
  const days = [...daySet].sort();

  const combinedByDay = new Map(combined.map((p) => [p.day, p.pnl]));

  const rows: Array<Record<string, string | number>> = [];
  for (const day of days) {
    const row: Record<string, string | number> = { day };
    let sum = 0;
    blocks.forEach((b, i) => {
      const v = b.dailyPnl.find((d) => d.day === day)?.pnl ?? 0;
      row[`a${i}`] = v;
      sum += v;
    });
    row.total = combinedByDay.get(day) ?? sum;
    rows.push(row);
  }
  return rows;
}

function mergeCumOverlay(blocks: PerAccountChartBlock[], combinedEq: EquitySeriesPoint[]) {
  const daySet = new Set<string>();
  for (const b of blocks) {
    for (const p of b.equitySeries) daySet.add(dayFromTs(p.ts));
  }
  for (const p of combinedEq) daySet.add(dayFromTs(p.ts));
  const days = [...daySet].sort();

  const combinedByDay = new Map(combinedEq.map((p) => [dayFromTs(p.ts), p.cumPnl]));

  const rows: Array<Record<string, string | number>> = [];
  for (const day of days) {
    const row: Record<string, string | number> = { day };
    blocks.forEach((b, i) => {
      const pt = b.equitySeries.find((p) => dayFromTs(p.ts) === day);
      row[`c${i}`] = pt?.cumPnl ?? 0;
    });
    const fromCombined = combinedByDay.get(day);
    if (fromCombined !== undefined) row.totalCum = fromCombined;
    else {
      let s = 0;
      for (let i = 0; i < blocks.length; i++) s += Number(row[`c${i}`] ?? 0);
      row.totalCum = s;
    }
    rows.push(row);
  }
  return rows;
}

function OverlayTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string | number }>;
}) {
  if (!active || !label || !payload?.length) return null;
  const rows = [...payload].filter((p) => p.dataKey !== "total" && p.dataKey !== "totalCum");
  const total = payload.find((p) => p.dataKey === "total" || p.dataKey === "totalCum");
  return (
    <div className="rounded-xl border bg-popover/95 px-3 py-2.5 text-popover-foreground shadow-lg backdrop-blur-sm">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
        {rows.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center justify-between gap-6 text-xs tabular-nums">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
            </span>
            <span className={Number(p.value) >= 0 ? "text-emerald-500" : "text-rose-500"}>
              {formatUsd(typeof p.value === "number" ? p.value : Number(p.value))}
            </span>
          </div>
        ))}
      </div>
      {total?.value !== undefined ? (
        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-xs font-medium tabular-nums">
          <span className="text-muted-foreground">합계</span>
          <span className={Number(total.value) >= 0 ? "text-emerald-500" : "text-rose-500"}>
            {formatUsd(Number(total.value))}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function PnlChartsOverlay({
  perAccountCharts,
  combinedDailyPnl,
  combinedEquitySeries,
}: {
  perAccountCharts: PerAccountChartBlock[];
  combinedDailyPnl: DailyPnlPoint[];
  combinedEquitySeries: EquitySeriesPoint[];
}) {
  const dailyData = mergeDailyOverlay(perAccountCharts, combinedDailyPnl);
  const cumData = mergeCumOverlay(perAccountCharts, combinedEquitySeries);

  const accountSeries = perAccountCharts.map((b, i) => ({
    key: `a${i}`,
    cumKey: `c${i}`,
    label: b.label,
    color: strokeAt(i),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="overflow-hidden border-border/80 bg-card/80 shadow-sm ring-1 ring-foreground/[0.04] backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">일별 PnL (겹쳐보기)</CardTitle>
          <CardDescription>계정별 일 실현 손익 곡선 — 같은 축에서 비교합니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[min(22rem,55vh)] pb-2">
          {dailyData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.12} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} minTickGap={28} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                  width={56}
                />
                <ReTooltip content={<OverlayTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (value === "total" ? "합계 (참고)" : String(value))}
                />
                {accountSeries.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="total"
                  name="합계 (참고)"
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 bg-card/80 shadow-sm ring-1 ring-foreground/[0.04] backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">누적 실현 PnL (겹쳐보기)</CardTitle>
          <CardDescription>계정별 누적 곡선. 합계는 선택 구간 기준입니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[min(22rem,55vh)] pb-2">
          {cumData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.12} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} minTickGap={28} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                  width={56}
                />
                <ReTooltip content={<OverlayTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (value === "totalCum" ? "합계 (참고)" : String(value))}
                />
                {accountSeries.map((s) => (
                  <Line
                    key={s.cumKey}
                    type="monotone"
                    dataKey={s.cumKey}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="totalCum"
                  name="합계 (참고)"
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
