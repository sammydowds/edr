"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { TimeseriesPoint } from "../types"

interface DetectionsAreaChartProps {
  data: TimeseriesPoint[]
}

const chartConfig = {
  low: {
    label: "Low",
    color: "var(--chart-1)",
  },
  medium: {
    label: "Medium",
    color: "var(--chart-2)",
  },
  high: {
    label: "High",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function DetectionsAreaChart({
  data,
}: DetectionsAreaChartProps) {
  function formatXAxis(value: string) {
    const date = new Date(value)

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  function formatTooltipLabel(value: string) {
    return new Date(value).toLocaleString()
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full p-2"
    >
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillLow" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-low)"
              stopOpacity={0.7}
            />
            <stop
              offset="95%"
              stopColor="var(--color-low)"
              stopOpacity={0.05}
            />
          </linearGradient>

          <linearGradient id="fillMedium" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-medium)"
              stopOpacity={0.7}
            />
            <stop
              offset="95%"
              stopColor="var(--color-medium)"
              stopOpacity={0.05}
            />
          </linearGradient>

          <linearGradient id="fillHigh" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-high)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-high)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} />

        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={formatXAxis}
        />

        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={formatTooltipLabel}
            />
          }
        />

        <YAxis
          hide
          domain={["dataMin", (dataMax: number) => dataMax * 1.15]}
        />

        <Area
          dataKey="low"
          type="natural"
          fill="url(#fillLow)"
          stroke="var(--color-low)"
          strokeWidth={2}
          fillOpacity={0.4}
          stackId="a"
        />

        <Area
          dataKey="medium"
          type="natural"
          fill="url(#fillMedium)"
          stroke="var(--color-medium)"
          strokeWidth={2}
          fillOpacity={0.5}
          stackId="a"
        />

        <Area
          dataKey="high"
          type="natural"
          fill="url(#fillHigh)"
          stroke="var(--color-high)"
          strokeWidth={2}
          fillOpacity={0.6}
          stackId="a"
        />

        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
