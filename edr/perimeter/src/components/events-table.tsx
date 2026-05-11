import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Button } from "./ui/button"
import { type Event as EDRevent } from "@/components/types"
import { AlertTriangle, FishingHook } from "lucide-react"
import { DetectionCard } from "./detection-card"

const SOURCE_LABEL: Record<number, string> = {
  1: "lsm/socket_connect",
  2: "tracepoint/syscalls/sys_enter_openat",
}

export function timeAgo(dateString: string): string {
  const target = new Date(dateString).getTime()
  const now = Date.now()

  if (isNaN(target)) return "invalid"

  let diff = Math.floor((now - target) / 1000)

  if (diff < 60) return "now"

  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const remHours = hours % 24
  const remMinutes = minutes % 60

  if (minutes < 60) return `${minutes}m ago`

  if (hours < 24) {
    return remMinutes > 0
      ? `${hours}h ${remMinutes}m ago`
      : `${hours}h ago`
  }

  return remHours > 0
    ? `${days}d ${remHours}h ago`
    : `${days}d ago`
}

function formatDelta(ns: number) {
  const ms = ns / 1_000_000

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const remSeconds = seconds % 60
  const remMinutes = minutes % 60

  if (minutes < 1) return `+${seconds}s`

  if (hours < 1) {
    return remSeconds > 0
      ? `+${minutes}m ${remSeconds}s`
      : `+${minutes}m`
  }

  return remMinutes > 0
    ? `+${hours}h ${remMinutes}m`
    : `+${hours}h`
}

interface RenderEventType {
  e: EDRevent
  onSelectPid: (id: number) => void
  onSelectPpid: (id: number) => void
  onSelectUid: (id: number) => void
  onOpenDetections: (e: EDRevent) => void
}

function renderEvent({
  e,
  onSelectPid,
  onSelectPpid,
  onSelectUid,
  onOpenDetections
}: RenderEventType) {
  const pid = (
    <span
      onClick={() => onSelectPid(e.pid)}
      className="underline hover:cursor-pointer hover:text-blue-600"
    >
      {e.pid}
    </span>
  )

  const ppid = (
    <span
      onClick={() => onSelectPpid(e.ppid)}
      className="underline hover:cursor-pointer hover:text-blue-600"
    >
      {e.ppid}
    </span>
  )

  const uid = (
    <span
      onClick={() => onSelectUid(e.uid)}
      className="underline hover:cursor-pointer hover:text-blue-600"
    >
      {e.uid}
    </span>
  )

  switch (e.source) {
    default:
      return (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <FishingHook size={12} />
            {SOURCE_LABEL[e.source] ?? "unknown_hook_source"}
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-mono">{e.comm}</span>
            </div>
            <div className="flex items-center">
              {e.filename ? <span className="font-mono text-chart-5">{e.filename}</span> :
                <span className="font-mono text-chart-5">{e.remote_ip4}:{e.remote_port}</span>}
            </div>
          </div>
          <div className="text-xs flex gap-2 text-muted-foreground">
            <span>ppid: {ppid}</span>
            <span>pid: {pid}</span>
            <span>uid: {uid}</span>

          </div>
        </div>
      )
  }
}

function renderDevice(e: EDRevent) {
  return (
    <div className="flex flex-col">
      <div className="text-xs">{e.device_name}</div>
      <div className="text-[10px] text-muted-foreground">
        {e.os_name} v{e.os_version}
      </div>
    </div>
  )
}

function DetectionDrawer({
  event,
  onClose,
}: {
  event: EDRevent
  onClose: () => void
}) {
  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-background border-l shadow-xl z-50 flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <div>
          <div className="text-xs text-muted-foreground">
            Detections
          </div>
          <div className="font-mono font-bold">
            PID {event.pid}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-black"
        >
          close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {event.detections?.length ? (
          event.detections.map((d, i) => {
            return (
              <div className="border-1">
                <DetectionCard detection={d} />
              </div>
            )
          })
        ) : (
          <div className="text-xs text-muted-foreground p-2">
            No detections
          </div>
        )}
      </div>
    </div>
  )
}

function ProcessDrawer({
  id,
  title,
  events,
  onClose,
}: {
  id: number
  title: string
  events: EDRevent[]
  onClose: () => void
}) {
  const sorted = React.useMemo(() => {
    return [...events].sort(
      (a, b) => (a.kernel_time ?? 0) - (b.kernel_time ?? 0)
    )
  }, [events])

  const baseTime = sorted[0]?.kernel_time ?? 0

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-background border-l shadow-xl z-50 flex flex-col">
      <div className="p-3 border-b flex justify-between items-center shrink-0">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="font-mono font-bold">{id}</div>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-black hover:cursor-pointer"
        >
          close
        </button>
      </div>

      <div className="py-2 flex-1 overflow-y-auto">
        {sorted.map((e, i) => (
          <div key={i} className="text-xs px-2 flex justify-between gap-2">
            {e.source === 1 ? (
              <div className="flex items-center">
                net {e.comm} → {e.remote_ip4}:{e.remote_port} {e.action ? <div className="bg-red-500 text-white px-1 rounded-[2px] ml-1 text-[8px] font-bold">BLOCKED</div> : null}
              </div>
            ) : e.source === 2 ? (
              <span>
                file {e.comm} → {e.filename}
              </span>
            ) : (
              <span>event</span>
            )}

            <span className="whitespace-nowrap text-orange-600 flex gap-2 items-center">
              <span>{formatDelta((e.kernel_time ?? 0) - baseTime)}</span>
              <span className="text-muted-foreground">
                {timeAgo(e.timestamp)}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t flex gap-2 shrink-0">
        <Button className="flex-1 rounded-sm cursor-pointer bg-orange-600">Escalate</Button>
      </div>
    </div>
  )
}

export function EventsTable({ data }: { data: EDRevent[] }) {
  const [selected, setSelected] = React.useState<{
    type: "pid" | "ppid" | "uid" | null
    id: number | null
  }>({ type: null, id: null })
  const [selectedDetectionsEvent, setSelectedDetectionsEvent] = React.useState<EDRevent | null>(null)

  const pidMap = React.useMemo(() => {
    const m = new Map<number, EDRevent[]>()
    for (const e of data) {
      if (!m.has(e.pid)) m.set(e.pid, [])
      m.get(e.pid)!.push(e)
    }
    return m
  }, [data])

  const ppidMap = React.useMemo(() => {
    const m = new Map<number, EDRevent[]>()
    for (const e of data) {
      if (!m.has(e.ppid)) m.set(e.ppid, [])
      m.get(e.ppid)!.push(e)
    }
    return m
  }, [data])

  const uidMap = React.useMemo(() => {
    const m = new Map<number, EDRevent[]>()
    for (const e of data) {
      if (!m.has(e.uid)) m.set(e.uid, [])
      m.get(e.uid)!.push(e)
    }
    return m
  }, [data])

  const sortedData = React.useMemo(() => {
    return [...data].sort(
      (a, b) => (b.kernel_time ?? 0) - (a.kernel_time ?? 0)
    )
  }, [data])

  const open = (type: "pid" | "ppid" | "uid", id: number) => {
    setSelected({ type, id })
  }
  const openDetections = (e: EDRevent) => {
    setSelectedDetectionsEvent(e)
  }

  const close = () => setSelected({ type: null, id: null })

  const activeEvents =
    selected.type === "pid"
      ? pidMap.get(selected.id!) || []
      : selected.type === "ppid"
        ? ppidMap.get(selected.id!) || []
        : selected.type === "uid"
          ? uidMap.get(selected.id!) || []
          : []

  const columns = React.useMemo<ColumnDef<EDRevent>[]>(() => [
    {
      header: "Event",
      cell: ({ row }) =>
        renderEvent({
          e: row.original,
          onSelectPid: (id) => open("pid", id),
          onSelectPpid: (id) => open("ppid", id),
          onSelectUid: (id) => open("uid", id),
          onOpenDetections: openDetections,
        }),
    },
    {
      header: "Detections",
      cell: ({ row }) => (
        <>
          {
            row.original.detections && row.original.detections?.length > 0 && (
              <span
                onClick={() => openDetections(row.original)}
                className="rounded text-red-700 cursor-pointer underline flex items-center gap-1"
              >
                <AlertTriangle fill="yellow" size={16} />
                {row.original.detections.length} tactic(s) detected
              </span>
            )
          }
        </>
      )
    },
    {
      header: "Device",
      cell: ({ row }) => renderDevice(row.original),
    },
    {
      header: "Time",
      cell: ({ row }) => timeAgo(row.original.timestamp),
    },
  ], [])

  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="relative">
      {selected.type && selected.id !== null && (
        <ProcessDrawer
          id={selected.id}
          title={selected.type.toUpperCase()}
          events={activeEvents}
          onClose={close}
        />
      )}
      {selectedDetectionsEvent && (
        <DetectionDrawer
          event={selectedDetectionsEvent}
          onClose={() => setSelectedDetectionsEvent(null)}
        />
      )}

      <Table>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id} className="hover:bg-unset">
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
