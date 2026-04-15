"use client";

import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
        <Button variant="outline" className="h-9 gap-2">
          Accounts
          {selectedCount > 0 ? <Badge variant="secondary">{selectedCount}</Badge> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2" align="start">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs text-muted-foreground">Select accounts to compare</div>
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
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted"
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
        <div className="px-2 pt-2 text-xs text-muted-foreground">
          When accounts are selected, the dashboard aggregates only those accounts.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

