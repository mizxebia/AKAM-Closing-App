import { CheckCircle2, Circle } from 'lucide-react'
import { PROCESS_CHECKPOINT_OPTIONS } from '../constants/processCheckpoints'

interface ProcessCheckpointTrackerProps {
  /** Raw `cr109_processcheckpoint` values present on the ticket, if any. */
  processCheckpoints: number[] | undefined
}

/**
 * Admin-only, read-only checklist of the real Dataverse "Process
 * Checkpoint" field — a multi-select, so a ticket can have any number of
 * these marked at once rather than sitting at one current stage.
 */
export function ProcessCheckpointTracker({
  processCheckpoints,
}: ProcessCheckpointTrackerProps) {
  const completed = new Set(
    (processCheckpoints ?? []).map((value) => Number(value))
  )

  return (
    <section className="form-section">
      <h3>Process Checkpoint</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {PROCESS_CHECKPOINT_OPTIONS.map((option) => {
          const isDone = completed.has(option.value)
          return (
            <div
              key={option.value}
              className={
                isDone
                  ? 'flex items-center gap-1.5 text-xs font-medium text-[#1E3A47]'
                  : 'flex items-center gap-1.5 text-xs font-medium text-[#94a3b8]'
              }
            >
              {isDone ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-[#1E3A47]" />
              ) : (
                <Circle className="size-3.5 shrink-0 text-[#D5CBB8]" />
              )}
              {option.label}
            </div>
          )
        })}
      </div>
    </section>
  )
}
