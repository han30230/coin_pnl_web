import { AppShell } from "@/components/layout/app-shell";
import { TradesClient } from "@/components/trades/trades-client";

export default function TradesPage() {
  return (
    <AppShell>
      <TradesClient />
    </AppShell>
  );
}

