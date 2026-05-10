"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DetectionsPieChart } from "./detections-pie"
import { DetectionsRadar } from "./detections-radar"
import { TimeseriesPoint } from "../types"
import { DetectionsAreaChart } from "./detections-area"

const WINDOW_TO_INTERVAL: Record<string, string> = {
  "1h": "1m",
  "6h": "5m",
  "24h": "15m",
}

export function Detections() {
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

  const counts = React.useMemo(() => {
    return data.reduce(
      (acc, point) => {
        acc.low += point.low ?? 0
        acc.medium += point.medium ?? 0
        acc.high += point.high ?? 0
        return acc
      },
      { low: 0, medium: 0, high: 0 }
    )
  }, [data])

  return (
    <div className="flex flex-col p-2 gap-6 relative">
      <div className="flex items-center absolute top-0 left-2 z-100">
        <div className="w-[200px]">
          <DetectionsPieChart counts={counts} />
        </div>
        <div className="w-[300px]">
          <DetectionsRadar data={data} />
        </div>
      </div>

      <div className="flex-1">
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
      </div>
      <div className="grow pt-12">
        <DetectionsAreaChart data={data} />
      </div>
    </div>
  )
}
