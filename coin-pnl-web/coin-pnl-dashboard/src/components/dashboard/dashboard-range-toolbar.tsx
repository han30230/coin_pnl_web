"use client";

import * as React from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AccountMultiSelect } from "@/components/dashboard/account-multi-select";
import { Input } from "@/components/ui/input";
import type { DashboardQueryState, RangePreset } from "@/lib/dashboard-query";
import { Building2, CalendarDays, CalendarRange, Layers } from "lucide-react";

type AccountOpt = { accountId: string; label: string; exchange: "binance" | "bybit" };

export function DashboardRangeToolbar({
  value,
  onChange,
  allAccounts,
  showAccounts = true,
}: {
  value: DashboardQueryState;
  onChange: (next: DashboardQueryState) => void;
  allAccounts: AccountOpt[] | undefined;
  showAccounts?: boolean;
}) {
  const set = (patch: Partial<DashboardQueryState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border/60">
          기간
        </span>
        <SegmentedControl
          size="lg"
          value={value.preset}
          onChange={(p: RangePreset) => set({ preset: p })}
          options={[
            { id: "7d", label: "7일", icon: <CalendarDays /> },
            { id: "30d", label: "30일", icon: <CalendarDays /> },
            { id: "90d", label: "90일", icon: <CalendarDays /> },
            { id: "all", label: "전체", icon: <CalendarDays /> },
            { id: "custom", label: "직접", icon: <CalendarRange /> },
          ]}
        />
      </div>

      {value.preset === "custom" ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-3 ring-1 ring-white/[0.04]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">시작일</label>
            <Input
              type="date"
              className="h-10 w-[11rem] rounded-xl border-border/80 bg-background font-medium shadow-sm"
              value={value.customStart}
              onChange={(e) => set({ customStart: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">종료일</label>
            <Input
              type="date"
              className="h-10 w-[11rem] rounded-xl border-border/80 bg-background font-medium shadow-sm"
              value={value.customEnd}
              onChange={(e) => set({ customEnd: e.target.value })}
            />
          </div>
          <p className="max-w-md pb-1 text-xs text-muted-foreground">UTC 기준 일 단위로 조회합니다.</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border/60">
          거래소
        </span>
        <SegmentedControl
          size="lg"
          value={value.exchange}
          onChange={(ex: DashboardQueryState["exchange"]) => set({ exchange: ex })}
          options={[
            { id: "all", label: "전체", icon: <Layers /> },
            { id: "binance", label: "Binance", icon: <Building2 /> },
            { id: "bybit", label: "Bybit", icon: <Building2 /> },
          ]}
        />
      </div>

      {showAccounts && allAccounts && allAccounts.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <AccountMultiSelect options={allAccounts} value={value.accountIds} onChange={(ids) => set({ accountIds: ids })} />
        </div>
      ) : null}
    </div>
  );
}
