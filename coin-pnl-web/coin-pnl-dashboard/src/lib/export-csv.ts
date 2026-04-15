/** UTF-8 BOM so Excel (Windows) opens Korean headers correctly. */
const BOM = "\uFEFF";

function csvEscape(cell: string | number | undefined | null): string {
  const s = cell === undefined || cell === null ? "" : String(cell);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadTradesCsv(
  filename: string,
  rows: Array<{
    executedAt: string;
    symbol: string;
    side: string;
    quantity: number;
    entryPrice?: number;
    exitPrice?: number;
    realizedPnl: number;
    exchange: string;
    accountLabel: string;
  }>,
) {
  const headers = [
    "체결시간(UTC)",
    "심볼",
    "방향",
    "수량",
    "진입가",
    "청산가",
    "실현손익",
    "거래소",
    "계정",
  ];
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((t) =>
      [
        t.executedAt,
        t.symbol,
        t.side,
        t.quantity,
        t.entryPrice ?? "",
        t.exitPrice ?? "",
        t.realizedPnl,
        t.exchange,
        t.accountLabel,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];
  const blob = new Blob([BOM + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
