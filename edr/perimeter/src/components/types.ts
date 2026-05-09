import { z } from "zod"

export const schema = z.object({
  // timing
  kernel_time: z.number().optional(),
  timestamp: z.string(),

  // process
  pid: z.number(),
  ppid: z.number(),
  uid: z.number(),
  gid: z.number(),

  // classification
  source: z.number(),
  action: z.number(),

  // network
  family: z.number(),
  remote_port: z.number(),
  remote_ip4: z.string(),

  // process identity
  comm: z.string(),
  filename: z.string(),

  // device (NOW STRINGS)
  device_id: z.number(),
  device_name: z.string(),
  os_name: z.string(),
  os_version: z.string(),

  // detection enrichment
  suspicious: z.boolean(),
  severity: z.string().optional(),

  detections: z.array(
    z.object({
      rule_id: z.string(),
      rule_name: z.string(),
      description: z.string().optional(),
      severity: z.string(),
      confidence: z.number(),
      mitre_technique_id: z.string(),
      mitre_technique_name: z.string(),
      mitre_tactic: z.string(),
    })
  ),
})

export type TimeseriesPoint = {
  time: string
  low: number
  medium: number
  high: number
  "Initial Access": number
  Execution: number
  Persistence: number
  "Privilege Escalation": number
  "Defense Evasion": number
  "Credential Access": number
  Discovery: number
  "Lateral Movement": number
  Collection: number
  Exfiltration: number
  Impact: number
}


export type Event = z.infer<typeof schema>
