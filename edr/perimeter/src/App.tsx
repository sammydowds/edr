import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { type Event as EDRevent } from "@/components/types"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { DetectionsData } from "./components/detections-data"

export default function Page() {
  const [events, setEvents] = useState<EDRevent[]>([])
  const [suspiciousEvents, setSuspiciousEvents] = useState<EDRevent[]>([])
  const [detections, setDetections] = useState<EDRevent["detections"]>([])

  const [loading, setLoading] = useState(true)

  console.log(events)
  console.log(detections)

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://172.16.189.132:8000/events")
      const data = await res.json()

      setEvents(data)
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuspiciousEvents = async () => {
    try {
      const res = await fetch("http://172.16.189.132:8000/suspicious")
      const data = await res.json()

      setSuspiciousEvents(data)
    } catch (err) {
      console.error("Failed to fetch suspicious events:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetections = async () => {
    try {
      const res = await fetch("http://172.16.189.132:8000/detections")
      const data = await res.json()

      setDetections(data)
    } catch (err) {
      console.error("Failed to fetch detections:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    fetchSuspiciousEvents()
    fetchDetections()

    const interval = setInterval(() => {
      fetchEvents()
      fetchSuspiciousEvents()
      fetchDetections()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />

      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col">
              <div>
                <div className="p-2 text-xs border-b font-semibold">
                  Dashboard
                </div>

                <DetectionsData detections={detections} />
              </div>

              {loading ? (
                <div className="text-muted-foreground">
                  Loading events...
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <div className="p-2 text-xs border-y font-semibold">
                      Suspicious Events
                    </div>

                    <DataTable data={suspiciousEvents} />
                  </div>

                  {/* <div className="flex flex-col">
                    <div className="p-2 text-xs border-y font-semibold">
                      Recent Events
                    </div>

                    <DataTable data={events} />
                  </div> */}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
