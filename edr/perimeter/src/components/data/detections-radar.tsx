"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { TimeseriesPoint } from "../types"

interface MitreRadarProps {
  data: TimeseriesPoint[]
}

// TODO: update with all tactics eventually
const MITRE_CATEGORIES = [
  "Exploiting",
  "Persisting",
  "Recon",
  "Moving",
  "Destruction",
]

export function DetectionsRadar({ data }: MitreRadarProps) {
  const chartData = React.useMemo(() => {
    const totals: Record<string, number> = {}

    for (const tactic of MITRE_CATEGORIES) {
      totals[tactic] = 0
    }

    for (const point of data) {
      for (const tactic of MITRE_CATEGORIES) {
        totals[tactic] += point[tactic] ?? 0
      }
    }

    return MITRE_CATEGORIES.map((tactic) => ({
      tactic,
      value: totals[tactic],
    }))
  }, [data])

  console.log(chartData)

  const chartConfig = {
    value: {
      label: "Detections",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square overflow-visible"

    >
      <RadarChart data={chartData} margin={{
        top: 0,
        right: 90,
        bottom: 0,
        left: 60,
      }}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />

        <PolarAngleAxis dataKey="tactic" fontSize={8} />

        <PolarGrid />

        <Radar
          dataKey="value"
          fill="var(--color-value)"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ChartContainer>
  )
}
