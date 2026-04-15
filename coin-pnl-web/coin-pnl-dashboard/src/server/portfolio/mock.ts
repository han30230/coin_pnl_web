import type { AccountSnapshot } from "@/server/exchanges/common";

export function makeMockSnapshots(): AccountSnapshot[] {
  const now = Date.now();
  const mk = (n: number) => new Date(now - n * 3600_000).toISOString();
  return [
    {
      accountId: "binance:default",
      exchange: "binance",
      label: "Binance",
      lastUpdatedAt: new Date().toISOString(),
      trades: [
        {
          tradeId: "m1",
          accountId: "binance:default",
          exchange: "binance",
          symbol: "BTCUSDT",
          side: "buy",
          quantity: 0.01,
          entryPrice: 65000,
          exitPrice: 66200,
          realizedPnl: 12.3,
          executedAt: mk(30),
        },
        {
          tradeId: "m2",
          accountId: "binance:default",
          exchange: "binance",
          symbol: "ETHUSDT",
          side: "sell",
          quantity: 0.2,
          entryPrice: 3400,
          exitPrice: 3450,
          realizedPnl: -8.1,
          executedAt: mk(18),
        },
      ],
      equitySeries: [{ ts: new Date().toISOString(), equity: 10342.12 }],
    },
    {
      accountId: "bybit:jk",
      exchange: "bybit",
      label: "Bybit (JK)",
      lastUpdatedAt: new Date().toISOString(),
      trades: [
        {
          tradeId: "m3",
          accountId: "bybit:jk",
          exchange: "bybit",
          symbol: "SOLUSDT",
          side: "buy",
          quantity: 10,
          entryPrice: 140,
          exitPrice: 148,
          realizedPnl: 22.0,
          executedAt: mk(9),
        },
      ],
      equitySeries: [{ ts: new Date().toISOString(), equity: 8020.55 }],
    },
  ];
}

