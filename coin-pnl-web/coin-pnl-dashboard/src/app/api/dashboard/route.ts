import { NextResponse } from "next/server";
import { DashboardQuerySchema } from "@/server/portfolio/types";
import { resolveRange } from "@/server/portfolio/time";
import { fetchSnapshots } from "@/server/portfolio/service";
import { normalizeDashboard } from "@/server/portfolio/normalize";
import { getExchangeAccountsFromEnv } from "@/server/config/accounts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = DashboardQuerySchema.safeParse({
    exchange: url.searchParams.get("exchange") ?? undefined,
    accountIds: url.searchParams.get("accountIds") ?? undefined,
    preset: url.searchParams.get("preset") ?? undefined,
    start: url.searchParams.get("start") ?? undefined,
    end: url.searchParams.get("end") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const query = parsed.data;
  const range = resolveRange({ preset: query.preset, startIso: query.start, endIso: query.end });

  const allAccounts = getExchangeAccountsFromEnv().map((a) => ({
    accountId: a.accountId,
    exchange: a.exchange,
    label: a.label,
    strategy: a.strategy,
  }));

  const { snapshots, errors } = await fetchSnapshots({
    exchange: query.exchange,
    accountIds: query.accountIds,
    range,
  });

  const body = normalizeDashboard({
    query,
    allAccounts,
    snapshots,
    errors,
  });

  return NextResponse.json(body, { status: 200 });
}

