import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <AnalyticsClient />
    </AppShell>
  );
}

