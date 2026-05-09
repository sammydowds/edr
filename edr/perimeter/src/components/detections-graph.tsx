"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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

type TimeseriesPoint = {
  time: string
  low: number
  medium: number
  high: number
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

const WINDOW_TO_INTERVAL: Record<string, string> = {
  "1h": "1m",
  "6h": "5m",
  "24h": "15m",
}

export function DetectionsGraph() {
  const [data, setData] = React.useState<TimeseriesPoint[]>([])
  const [window, setWindow] = React.useState("1h")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    fetchTimeseries()

    const interval = setInterval(fetchTimeseries, 5000)

    return () => clearInterval(interval)
  }, [window])

  async function fetchTimeseries() {
    try {
      setLoading(true)

      const interval = WINDOW_TO_INTERVAL[window] ?? "1m"

      const res = await fetch(
        `http://172.16.189.132:8000/detections/timeseries?window=${window}&interval=${interval}`
      )

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const json = await res.json()

      setData(json)
    } catch (err) {
      console.error("Failed to fetch timeseries", err)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="p-4">
      <Select value={window} onValueChange={setWindow}>
        <SelectTrigger
          className="hidden w-[140px] rounded-lg sm:ml-auto sm:flex"
          aria-label="Select time range"
        >
          <SelectValue placeholder="Select range" />
        </SelectTrigger>

        <SelectContent className="rounded-xl">
          <SelectItem value="1h" className="rounded-lg">
            Last Hour
          </SelectItem>

          <SelectItem value="6h" className="rounded-lg">
            Last 6 Hours
          </SelectItem>

          <SelectItem value="24h" className="rounded-lg">
            Last 24 Hours
          </SelectItem>
        </SelectContent>
      </Select>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[300px] w-full"
      >
        <AreaChart data={data}>
          <defs>
            <linearGradient
              id="fillLow"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
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

            <linearGradient
              id="fillMedium"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
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

            <linearGradient
              id="fillHigh"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
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

          <ChartLegend
            content={<ChartLegendContent />}
          />
        </AreaChart>
      </ChartContainer>
    </div>

  )
}
