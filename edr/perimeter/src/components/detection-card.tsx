import { Event as EDRevent } from "./types"
import { cn } from "@/lib/utils";

interface DetectionCardProps {
  detection: EDRevent["detections"][number]
}
export const DetectionCard = ({ detection }: DetectionCardProps) => {
  const severityLevel = detection.severity === "high"
    ? 3
    : detection.severity === "medium"
      ? 2
      : detection.severity === "low"
        ? 1
        : 0;
  return (
    <>
      <div
        className={cn("flex items-start justify-between gap-4 p-3")}
      >
        <div className="flex items-center">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">{detection.mitre_tactic}</div>
            <div className="flex flex-col justify-center gap-0">
              <span className="font-medium text-md">
                {detection.rule_name}
              </span>
              <div className="text-sm text-muted-foreground">
                {detection.description}
              </div>
            </div>

            <div className="text-xs flex items-center gap-1">
              Tactic:
              <a className="text-xs text-blue-600 underline font-bold" target="_blank" rel="noopener noreferrer" href={`https://attack.mitre.org/techniques/${detection.mitre_technique_id}`}> {detection.mitre_technique_id}: {detection.mitre_technique_name}</a>
            </div>
          </div>
        </div>


        <div className="flex items-center gap-[3px] pr-5">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={cn(
                "h-[8px] w-[16px] rounded-[1px]",
                level <= severityLevel
                  ? severityLevel === 3
                    ? "bg-chart-5"
                    : severityLevel === 2
                      ? "bg-chart-3"
                      : "bg-chart-1"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>
    </>
  )
}
