"use client";

import LiveLineChart from "@/components/charts/live-line-chart";
import { ChartTooltip } from "@/components/charts/tooltip";

export function LiveRateChart({ points, value, paused }: { points: { time: number; value: number }[]; value: number; paused: boolean }) {
  return <LiveLineChart data={points} value={value} window={300} paused={paused} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} className="h-full">
    <ChartTooltip showDatePill={false} />
  </LiveLineChart>;
}