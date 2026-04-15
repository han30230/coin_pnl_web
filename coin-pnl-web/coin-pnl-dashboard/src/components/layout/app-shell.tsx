"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/trades", label: "Trades" },
  { href: "/analytics", label: "Analytics" },
];

export function AppShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-60 flex-shrink-0 lg:block">
          <div className="sticky top-6 rounded-xl border bg-card">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <div className="text-sm font-semibold tracking-tight">Coin PnL</div>
                <div className="text-xs text-muted-foreground">Multi-account monitor</div>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                read-only
              </Badge>
            </div>
            <Separator />
            <nav className="flex flex-col p-2">
              {nav.map((i) => {
                const active = pathname === i.href;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
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

