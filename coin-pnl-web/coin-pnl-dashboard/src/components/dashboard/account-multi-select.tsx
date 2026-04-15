"use client";

import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export type AccountOption = { accountId: string; label: string; exchange: "binance" | "bybit" };

export function AccountMultiSelect({
  options,
  value,
  onChange,
}: {
  options: AccountOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = new Set(value);
  const selectedCount = value.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-2xl border-border/80 bg-gradient-to-b from-background to-muted/25 px-4 text-sm font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.06] transition hover:from-muted/30 hover:shadow-md dark:shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
        >
          계정
          {selectedCount > 0 ? <Badge variant="secondary">{selectedCount}</Badge> : null}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-xl border-border/80 p-2 shadow-lg" align="start">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs font-medium text-muted-foreground">비교할 계정 선택</div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        </div>
        <ScrollArea className="h-64">
          <div className="flex flex-col gap-1 p-1">
            {options.map((o) => {
              const checked = selected.has(o.accountId);
              return (
                <button
                  key={o.accountId}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/80"
                  onClick={() => {
                    const next = new Set(selected);
                    if (checked) next.delete(o.accountId);
                    else next.add(o.accountId);
                    onChange([...next]);
                  }}
                >
                  <Checkbox checked={checked} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{o.label}</div>
                    <div className="text-xs text-muted-foreground">{o.exchange}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <div className="px-2 pt-2 text-xs leading-relaxed text-muted-foreground">
          선택한 계정만 합산·차트에 반영됩니다. 비우면 필터에 맞는 전체 계정이 포함됩니다.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

