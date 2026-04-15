import crypto from "node:crypto";

export function toQueryStringSorted(params: Record<string, string | number | boolean | undefined>) {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, v);
  return sp.toString();
}

export function toQueryStringOrdered(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

export function hmacSha256Hex(secret: string, message: string) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

