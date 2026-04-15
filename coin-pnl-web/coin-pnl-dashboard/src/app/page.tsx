import { AppShell } from "@/components/layout/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function Home() {
  return (
    <AppShell>
      <DashboardClient />
    </AppShell>
  );
}
