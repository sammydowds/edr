"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface DetectionsPieChartProps {
  counts: {
    high: number
    medium: number
    low: number
  }
}

export function DetectionsPieChart({
  counts,
}: DetectionsPieChartProps) {
  const id = "pie-interactive"

  const chartData = React.useMemo(() => {
    return [
      {
        severity: "high",
        total: counts.high,
        fill: "var(--chart-5)",
      },
      {
        severity: "medium",
        total: counts.medium,
        fill: "var(--chart-3)",
      },
      {
        severity: "low",
        total: counts.low,
        fill: "var(--chart-1)",
      },
    ]
  }, [counts])

  const chartConfig = {
    high: { label: "High Sev", color: "red" },
    medium: { label: "Medium Sev", color: "orange" },
    low: { label: "Low Sev", color: "gray" },
  } satisfies ChartConfig

  return (
    <ChartContainer
      id={id}
      config={chartConfig}
      className="mx-auto aspect-square w-full max-w-[300px]"
    >
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
        />

        <Pie
          data={chartData}
          dataKey="total"
          nameKey="severity"
          innerRadius={0}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >

                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
