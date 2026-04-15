import { ExchangeAdapter, type AccountSnapshot, type NormalizedTrade, type TimeRange } from "./common";
import { httpJson } from "../http/http-client";
import { hmacSha256Hex, toQueryStringOrdered } from "./signing";

type BybitV5Response<T> = {
  retCode: number;
  retMsg: string;
  result?: T;
  time?: number;
};

export class BybitAdapter implements ExchangeAdapter {
  readonly exchange = "bybit" as const;

  private safeRetMsg(retMsg: string, apiKey: string) {
    // Bybit sometimes returns `origin_string[...]` which can include the apiKey.
    // Never propagate that raw string to client logs/JSON.
    return retMsg.replaceAll(apiKey, "***").slice(0, 400);
  }

  private async fetchClosedPnlPaged(args: {
    baseUrl: string;
    apiKey: string;
    apiSecret: string;
    recvWindow: number;
    timestamp: string;
    timeoutMs: number;
    startMs: number;
    endMs: number;
  }) {
    const all: Array<{
      orderId: string;
      symbol: string;
      side: "Buy" | "Sell";
      qty: string;
      avgEntryPrice: string;
      avgExitPrice: string;
      closedPnl: string;
      updatedTime: string;
    }> = [];

    let cursor: string | undefined;
    for (let i = 0; i < 20; i++) {
      const params: Record<string, string | number | undefined> = {
        category: "linear",
        startTime: args.startMs,
        endTime: args.endMs,
        limit: 200,
        cursor,
      };
      const qs = toQueryStringOrdered(params);
      const signPayload = `${args.timestamp}${args.apiKey}${args.recvWindow}${qs}`;
      const sig = hmacSha256Hex(args.apiSecret, signPayload);

      const res = await httpJson<
        BybitV5Response<{
          list: typeof all;
          nextPageCursor?: string;
        }>
      >({
        method: "GET",
        url: `${args.baseUrl}/v5/position/closed-pnl?${qs}`,
        headers: {
          "X-BAPI-API-KEY": args.apiKey,
          "X-BAPI-SIGN": sig,
          "X-BAPI-SIGN-TYPE": "2",
          "X-BAPI-TIMESTAMP": args.timestamp,
          "X-BAPI-RECV-WINDOW": String(args.recvWindow),
        },
        timeoutMs: args.timeoutMs,
      });

      if (res.retCode !== 0) {
        throw new Error(`Bybit closed-pnl failed: ${this.safeRetMsg(res.retMsg, args.apiKey)}`);
      }

      all.push(...(res.result?.list ?? []));
      const next = res.result?.nextPageCursor;
      if (!next) break;
      cursor = next;
    }

    return all;
  }

  async fetchAccountSnapshot(args: {
    accountId: string;
    label: string;
    apiKey: string;
    apiSecret: string;
    range: TimeRange;
    timeoutMs: number;
  }): Promise<AccountSnapshot> {
    const baseUrl = "https://api.bybit.com";
    const recvWindow = 5000;
    const timestamp = Date.now().toString();

    // Wallet balance (UNIFIED) - equity proxy.
    const walletParams = {
      accountType: "UNIFIED",
    };
    const walletQs = toQueryStringOrdered(walletParams);
    const walletSignPayload = `${timestamp}${args.apiKey}${recvWindow}${walletQs}`;
    const walletSig = hmacSha256Hex(args.apiSecret, walletSignPayload);

    const wallet = await httpJson<
      BybitV5Response<{
        list: Array<{
          totalEquity: string;
          totalWalletBalance: string;
          accountType: string;
        }>;
      }>
    >({
      method: "GET",
      url: `${baseUrl}/v5/account/wallet-balance?${walletQs}`,
      headers: {
        "X-BAPI-API-KEY": args.apiKey,
        "X-BAPI-SIGN": walletSig,
        "X-BAPI-SIGN-TYPE": "2",
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": String(recvWindow),
      },
      timeoutMs: args.timeoutMs,
    });

    if (wallet.retCode !== 0) {
      throw new Error(`Bybit wallet-balance failed: ${this.safeRetMsg(wallet.retMsg, args.apiKey)}`);
    }

    const equity = Number(wallet.result?.list?.[0]?.totalEquity ?? wallet.result?.list?.[0]?.totalWalletBalance ?? 0);

    // Closed PnL list (Derivatives)
    // Bybit constraint: the time range cannot exceed 7 days. We chunk the request.
    const maxSpanMs = 7 * 24 * 60 * 60 * 1000;
    const chunks: Array<{ startMs: number; endMs: number }> = [];
    for (let s = args.range.startMs; s < args.range.endMs; ) {
      const e = Math.min(args.range.endMs, s + maxSpanMs);
      chunks.push({ startMs: s, endMs: e });
      s = e;
    }

    const closedAll = (
      await Promise.all(
        chunks.map((c) =>
          this.fetchClosedPnlPaged({
            baseUrl,
            apiKey: args.apiKey,
            apiSecret: args.apiSecret,
            recvWindow,
            timestamp,
            timeoutMs: args.timeoutMs,
            startMs: c.startMs,
            endMs: c.endMs,
          }),
        ),
      )
    ).flat();

    const trades: NormalizedTrade[] =
      closedAll.map((x) => {
        const tsMs = Number(x.updatedTime);
        return {
          tradeId: `bybit-closed:${x.orderId}`,
          accountId: args.accountId,
          exchange: this.exchange,
          symbol: x.symbol,
          side: x.side === "Buy" ? "buy" : "sell",
          quantity: Number(x.qty),
          entryPrice: Number(x.avgEntryPrice),
          exitPrice: Number(x.avgExitPrice),
          realizedPnl: Number(x.closedPnl),
          executedAt: new Date(Number.isFinite(tsMs) ? tsMs : Date.now()).toISOString(),
        };
      }) ?? [];

    return {
      accountId: args.accountId,
      exchange: this.exchange,
      label: args.label,
      lastUpdatedAt: new Date().toISOString(),
      trades,
      equitySeries: [{ ts: new Date().toISOString(), equity }],
    };
  }
}

