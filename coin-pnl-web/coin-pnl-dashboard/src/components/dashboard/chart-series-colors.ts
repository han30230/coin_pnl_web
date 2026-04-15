/** Distinct hues for multi-account overlays (Recharts stroke). */
export const CHART_SERIES_STROKES = [
  "hsl(142.1 70.6% 42%)",
  "hsl(217.2 91.2% 56%)",
  "hsl(47.9 95.8% 50%)",
  "hsl(280 65% 58%)",
  "hsl(340 72% 52%)",
  "hsl(24 95% 53%)",
  "hsl(190 80% 45%)",
  "hsl(330 70% 55%)",
] as const;

export function strokeAt(i: number) {
  return CHART_SERIES_STROKES[i % CHART_SERIES_STROKES.length]!;
}
