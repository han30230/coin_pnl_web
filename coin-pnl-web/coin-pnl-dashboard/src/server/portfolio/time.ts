import { addDays, endOfDay, startOfDay } from "date-fns";

export function clampRange(args: { startMs: number; endMs: number; maxDays: number }) {
  const maxMs = args.maxDays * 24 * 60 * 60 * 1000;
  const span = args.endMs - args.startMs;
  if (span <= maxMs) return { startMs: args.startMs, endMs: args.endMs };
  return { startMs: args.endMs - maxMs, endMs: args.endMs };
}

export function resolveRange(args: {
  preset: "7d" | "30d" | "90d" | "all" | "custom";
  startIso?: string;
  endIso?: string;
  now?: Date;
}) {
  const now = args.now ?? new Date();

  if (args.preset === "custom") {
    const ymd = (s?: string) => {
      if (!s) return undefined;
      const t = s.trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : undefined;
    };
    const utcDayStartMs = (d: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
      if (!m) return NaN;
      return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
    };
    /** Exclusive end instant: start of (endDate + 1 day) UTC */
    const utcDayEndExclusiveMs = (d: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
      if (!m) return NaN;
      const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
      return t + 24 * 60 * 60 * 1000;
    };

    const s = ymd(args.startIso);
    const e = ymd(args.endIso);

    if (s && e) {
      let startMs = utcDayStartMs(s);
      let endMs = utcDayEndExclusiveMs(e);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        startMs = startOfDay(addDays(now, -30)).getTime();
        endMs = endOfDay(now).getTime() + 1;
      } else if (startMs > endMs) {
        return resolveRange({ preset: "custom", startIso: e, endIso: s, now: args.now });
      }
      return { startMs, endMs };
    }

    const start = args.startIso ? new Date(args.startIso) : addDays(now, -30);
    const end = args.endIso ? new Date(args.endIso) : now;
    let startMs = startOfDay(start).getTime();
    let endMs = endOfDay(end).getTime() + 1;
    if (startMs > endMs) {
      const t = startMs;
      startMs = endMs;
      endMs = t;
    }
    return { startMs, endMs };
  }

  if (args.preset === "all") {
    // Conservative default: 365 days to prevent huge API loads.
    const start = addDays(now, -365);
    return {
      startMs: startOfDay(start).getTime(),
      endMs: endOfDay(now).getTime() + 1,
    };
  }

  const days = args.preset === "7d" ? 7 : args.preset === "30d" ? 30 : 90;
  const start = addDays(now, -days);
  return {
    startMs: startOfDay(start).getTime(),
    endMs: endOfDay(now).getTime() + 1,
  };
}

export function toUtcDayKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

