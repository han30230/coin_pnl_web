"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ id: T; label: string; icon?: React.ReactNode }>;
  /** Slightly larger tap targets + shadow (filters toolbar). */
  size?: "default" | "lg";
  className?: string;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "default",
  className,
}: SegmentedControlProps<T>) {
  const pad = size === "lg" ? "px-3.5 py-2 min-h-[2.25rem]" : "px-3 py-1.5 min-h-9";
  return (
    <div
      className={cn(
        "inline-flex rounded-2xl border border-border/80 bg-gradient-to-b from-muted/90 to-muted/50 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.35)]",
        className,
      )}
      role="tablist"
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "relative inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200",
              pad,
              active
                ? "bg-gradient-to-b from-background to-background/95 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.08)] ring-2 ring-primary/25 dark:shadow-[0_4px_14px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] dark:ring-primary/35"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
            )}
            onClick={() => onChange(o.id)}
          >
            {o.icon ? <span className="opacity-80 [&_svg]:size-3.5">{o.icon}</span> : null}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
