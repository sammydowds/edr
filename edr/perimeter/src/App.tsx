import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { EventsTable } from "@/components/events-table"
import { type Event as EDRevent } from "@/components/types"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { Detections } from "./components/data/detections"

export default function Page() {
  const [suspiciousEvents, setSuspiciousEvents] = useState<EDRevent[]>([])
  const [loading, setLoading] = useState(true)

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


  useEffect(() => {
    fetchSuspiciousEvents()

    const interval = setInterval(() => {
      fetchSuspiciousEvents()
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

                <Detections />
              </div>

              {loading ? (
                <div className="text-muted-foreground">
                  Loading events...
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <div className="p-2 text-xs border-b font-semibold">
                    </div>

                    <EventsTable data={suspiciousEvents} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
