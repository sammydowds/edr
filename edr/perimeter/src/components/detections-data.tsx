"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"

import type {
  PieSectorShapeProps,
} from "recharts/types/polar/Pie"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { type Event } from "./types"
import { DetectionCard } from "./detection-card"

export const description = "An interactive pie chart"

interface DetectionsDataProps {
  detections: Event["detections"]
}

export function DetectionsData({
  detections,
}: DetectionsDataProps) {
  const id = "pie-interactive"

  const flatDetections = detections ?? []

  const chartData = React.useMemo(() => {
    const counts: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
    }

    for (const d of flatDetections) {
      const sev = d.severity?.toLowerCase() || "low"

      if (counts[sev] !== undefined) {
        counts[sev]++
      }
    }

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
  }, [flatDetections])

  const chartConfig = {
    high: {
      label: "High",
      color: "red",
    },
    medium: {
      label: "Medium",
      color: "orange",
    },
    low: {
      label: "Low",
      color: "gray",
    },
  } satisfies ChartConfig

  const [activeSeverity, setActiveSeverity] =
    React.useState("all")

  const activeIndex = React.useMemo(() => {
    if (activeSeverity === "all") {
      return -1
    }

    return chartData.findIndex(
      (item) => item.severity === activeSeverity
    )
  }, [activeSeverity, chartData])

  const severities = React.useMemo(
    () => ["all", ...chartData.map((item) => item.severity)],
    [chartData]
  )

  const activeDetections = React.useMemo(() => {
    if (activeSeverity === "all") {
      return flatDetections
    }

    return flatDetections.filter(
      (d) =>
        d.severity?.toLowerCase() === activeSeverity
    )
  }, [flatDetections, activeSeverity])

  const totalDetections = React.useMemo(() => {
    return flatDetections.length
  }, [flatDetections])

  const renderPieShape = React.useCallback(
    ({
      index,
      outerRadius = 0,
      ...props
    }: PieSectorShapeProps) => {
      if (index === activeIndex) {
        return (
          <g>
            <Sector
              {...props}
              outerRadius={outerRadius + 10}
            />

            <Sector
              {...props}
              outerRadius={outerRadius + 10}
              innerRadius={outerRadius + 12}
            />
          </g>
        )
      }

      return (
        <Sector
          {...props}
          outerRadius={outerRadius}
        />
      )
    },
    [activeIndex]
  )

  return (
    <div className="flex flex-col w-full">
      <div className="flex">
        <div className="w-[375px] flex items-center border-r">
          <ChartContainer
            id={id}
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent hideLabel />
                }
              />

              <Pie
                data={chartData}
                dataKey="total"
                nameKey="severity"
                innerRadius={60}
                strokeWidth={5}
                shape={renderPieShape}
              >
                <Label
                  content={({ viewBox }) => {
                    if (
                      viewBox &&
                      "cx" in viewBox &&
                      "cy" in viewBox
                    ) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {activeDetections.length}
                          </tspan>

                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Tactics
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        <div className="flex flex-col w-full">
          <div className="flex justify-end w-full p-2 border-b">
            <Select
              value={activeSeverity}
              onValueChange={setActiveSeverity}
            >
              <SelectTrigger
                className="h-7 w-[180px] rounded-lg pl-2.5"
                aria-label="Select severity"
              >
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>

              <SelectContent
                align="end"
                className="rounded-xl"
              >
                {severities.map((key) => {
                  if (key === "all") {
                    return (
                      <SelectItem
                        key={key}
                        value={key}
                        className="rounded-lg [&_span]:flex"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className="flex h-3 w-3 shrink-0 rounded-xs"
                            style={{
                              backgroundColor: `var(--color-${key})`,
                            }}
                          />

                          All
                        </div>
                      </SelectItem>
                    )
                  }

                  const config =
                    chartConfig[
                    key as keyof typeof chartConfig
                    ]

                  if (!config) {
                    return null
                  }

                  return (
                    <SelectItem
                      key={key}
                      value={key}
                      className="rounded-lg [&_span]:flex"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="flex h-3 w-3 shrink-0 rounded-xs"
                          style={{
                            backgroundColor: `var(--color-${key})`,
                          }}
                        />

                        {config.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col divide-y max-h-[320px] overflow-y-auto">
            {activeDetections.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground">
                No detections
              </div>
            ) : (
              activeDetections.map((d, idx) => (
                <div id={`detections-${idx}`}>
                  <DetectionCard detection={d} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
