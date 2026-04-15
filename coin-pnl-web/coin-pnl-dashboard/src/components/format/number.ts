export function formatUsd(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(v);
}

export function formatCompact(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(v);
}

export function formatPct(n?: number) {
  if (n === undefined) return "—";
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(2)}%`;
}

