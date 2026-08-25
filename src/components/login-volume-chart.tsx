"use client";

import { AreaChart, Area } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { ChartTooltip } from "@/components/charts/tooltip";

export function LoginVolumeChart({ data }: { data: { time: string; success: number; failed: number }[] }) {
  return <AreaChart data={data} xDataKey="time" margin={{ top: 12, right: 8, bottom: 0, left: 0 }} aspectRatio="none" className="h-full">
    <Grid horizontal />
    <Area dataKey="success" fill="var(--chart-line-primary)" fillOpacity={0.28} strokeWidth={2} />
    <Area dataKey="failed" fill="var(--chart-line-secondary)" fillOpacity={0.14} strokeWidth={1.6} />
    <XAxis numTicks={6} />
    <ChartTooltip />
  </AreaChart>;
}
