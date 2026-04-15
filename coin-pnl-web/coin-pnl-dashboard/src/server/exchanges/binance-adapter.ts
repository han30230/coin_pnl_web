import { ExchangeAdapter, type AccountSnapshot, type TimeRange, type NormalizedTrade } from "./common";
import { httpJson } from "../http/http-client";
import { hmacSha256Hex, toQueryStringSorted } from "./signing";

/**
 * Binance adapter (read-only).
 *
 * Notes:
 * - Uses Binance Spot endpoints to fetch trades. For pure futures/strategy PnL,
 *   you'll likely swap this to Futures endpoints later, but the adapter shape stays.
 * - We normalize to a common trade model so the UI does not care about exchange specifics.
 */
export class BinanceAdapter implements ExchangeAdapter {
  readonly exchange = "binance" as const;

  async fetchAccountSnapshot(args: {
    accountId: string;
    label: string;
    apiKey: string;
    apiSecret: string;
    range: TimeRange;
    timeoutMs: number;
  }): Promise<AccountSnapshot> {
    // Binance Futures REST (read-only)
    // - Realized PnL: GET /fapi/v1/income?incomeType=REALIZED_PNL
    // - Equity proxy: GET /fapi/v2/account (totalWalletBalance)
    const baseUrl = "https://fapi.binance.com";
    const now = Date.now();
    const recvWindow = 5000;

    const incomeQuery = {
      incomeType: "REALIZED_PNL",
      startTime: args.range.startMs,
      endTime: args.range.endMs,
      timestamp: now,
      recvWindow,
      limit: 1000,
    };
    const incomeQs = toQueryStringSorted(incomeQuery);
    const incomeSig = hmacSha256Hex(args.apiSecret, incomeQs);
    const incomeUrl = `${baseUrl}/fapi/v1/income?${incomeQs}&signature=${incomeSig}`;

    const income = await httpJson<
      Array<{
        symbol: string;
        income: string;
        time: number;
        incomeType: string;
        asset: string;
        info: string;
      }>
    >({
      method: "GET",
      url: incomeUrl,
      headers: { "X-MBX-APIKEY": args.apiKey },
      timeoutMs: args.timeoutMs,
    });

    const trades: NormalizedTrade[] = income
      .filter((x) => x.incomeType === "REALIZED_PNL")
      .map((x) => ({
        tradeId: `binance-income:${x.time}:${x.symbol}`,
        accountId: args.accountId,
        exchange: this.exchange,
        symbol: x.symbol,
        side: "buy",
        quantity: 0,
        realizedPnl: Number(x.income),
        fee: undefined,
        feeAsset: undefined,
        executedAt: new Date(x.time).toISOString(),
      }));

    const acctQuery = {
      timestamp: now,
      recvWindow,
    };
    const acctQs = toQueryStringSorted(acctQuery);
    const acctSig = hmacSha256Hex(args.apiSecret, acctQs);
    const acctUrl = `${baseUrl}/fapi/v2/account?${acctQs}&signature=${acctSig}`;

    const acct = await httpJson<{
      totalWalletBalance: string;
      totalUnrealizedProfit: string;
      totalMarginBalance: string;
      updateTime?: number;
    }>({
      method: "GET",
      url: acctUrl,
      headers: { "X-MBX-APIKEY": args.apiKey },
      timeoutMs: args.timeoutMs,
    });

    return {
      accountId: args.accountId,
      exchange: this.exchange,
      label: args.label,
      lastUpdatedAt: new Date().toISOString(),
      trades,
      equitySeries: [
        {
          ts: new Date(acct.updateTime ?? now).toISOString(),
          equity: Number(acct.totalWalletBalance || acct.totalMarginBalance || 0),
        },
      ],
    };
  }
}

