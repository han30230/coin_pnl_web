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
    const start = args.startIso ? new Date(args.startIso) : addDays(now, -30);
    const end = args.endIso ? new Date(args.endIso) : now;
    return {
      startMs: startOfDay(start).getTime(),
      endMs: endOfDay(end).getTime() + 1,
    };
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

