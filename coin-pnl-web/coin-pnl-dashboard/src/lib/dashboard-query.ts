export type RangePreset = "7d" | "30d" | "90d" | "all" | "custom";

export type DashboardQueryState = {
  preset: RangePreset;
  exchange: "all" | "binance" | "bybit";
  accountIds: string[];
  customStart: string;
  customEnd: string;
};

export function defaultCustomDateStrings(): { customStart: string; customEnd: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { customStart: fmt(start), customEnd: fmt(end) };
}

export function buildDashboardFetchUrl(origin: string, q: DashboardQueryState): string {
  const u = new URL("/api/dashboard", origin);
  u.searchParams.set("preset", q.preset);
  u.searchParams.set("exchange", q.exchange);
  if (q.accountIds.length > 0) u.searchParams.set("accountIds", q.accountIds.join(","));
  if (q.preset === "custom") {
    if (q.customStart) u.searchParams.set("start", q.customStart);
    if (q.customEnd) u.searchParams.set("end", q.customEnd);
  }
  return u.toString();
}

export function dashboardQueryKey(prefix: string, q: DashboardQueryState): unknown[] {
  return [
    prefix,
    q.preset,
    q.exchange,
    q.accountIds.slice().sort().join(","),
    q.preset === "custom" ? q.customStart : "",
    q.preset === "custom" ? q.customEnd : "",
  ];
}
