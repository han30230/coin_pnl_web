"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart3, LayoutDashboard, ListOrdered } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: ListOrdered },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/35">
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-60 flex-shrink-0 lg:block">
          <div className="sticky top-6 overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card/95 to-muted/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-white/[0.05] backdrop-blur-md dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-bold tracking-tight">Coin PnL</div>
                <div className="text-xs text-muted-foreground">멀티 계정 모니터</div>
              </div>
              <Badge variant="secondary" className="border border-border/60 bg-muted/80 text-[10px] font-medium">
                read-only
              </Badge>
            </div>
            <Separator />
            <nav className="flex flex-col gap-0.5 p-2">
              {nav.map((i) => {
                const active = pathname === i.href;
                const Icon = i.icon;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-to-r from-primary/18 via-primary/8 to-transparent text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] before:absolute before:left-0 before:top-1/2 before:h-[58%] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {i.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <div className="text-sm font-semibold tracking-tight">Coin PnL</div>
              <div className="text-xs text-muted-foreground">{nav.find((n) => n.href === pathname)?.label}</div>
            </div>
            <div className="ml-auto">{right}</div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

