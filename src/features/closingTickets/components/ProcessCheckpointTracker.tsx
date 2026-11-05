import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import {
  FAILED_BOT_STATUS_CHECKPOINT,
  PROCESS_CHECKPOINT_STAGES,
  PROCESS_CHECKPOINT_VALUES,
} from '../constants/processCheckpoints'
import { getBotStatusLabel } from '../../devTools/utils/statusOptions'

interface ProcessCheckpointTrackerProps {
  currentBotStatus: number | undefined
}

/**
 * Admin-only, read-only "you are here" view of a single ticket's position
 * in the bot-automation lifecycle. A Failed Bot Status is placed at the
 * checkpoint it failed at (see FAILED_BOT_STATUS_CHECKPOINT) rather than
 * falling off the end of the tracker.
 */
export function ProcessCheckpointTracker({
  currentBotStatus,
}: ProcessCheckpointTrackerProps) {
  if (currentBotStatus === undefined) {
    return null
  }

  const isFailure = currentBotStatus in FAILED_BOT_STATUS_CHECKPOINT
  const effectiveValue = isFailure
    ? FAILED_BOT_STATUS_CHECKPOINT[currentBotStatus]
    : currentBotStatus
  const currentIndex = PROCESS_CHECKPOINT_VALUES.indexOf(
    effectiveValue as (typeof PROCESS_CHECKPOINT_VALUES)[number]
  )

  if (currentIndex === -1) {
    return null
  }

  return (
    <section className="form-section">
      <h3>Process Checkpoint</h3>
      <div className="flex flex-nowrap items-center gap-0 overflow-x-auto pb-1">
        {PROCESS_CHECKPOINT_STAGES.map((stage, index) => {
          const isCurrent = index === currentIndex
          const isPast = index < currentIndex
          const isCurrentFailure = isCurrent && isFailure

          const Icon = isCurrentFailure
            ? XCircle
            : isPast || isCurrent
              ? CheckCircle2
              : Circle

          const colorClass = isCurrentFailure
            ? 'text-[#b91c1c]'
            : isPast
              ? 'text-[#1E3A47]'
              : isCurrent
                ? 'text-[#C9A96E]'
                : 'text-[#c7bfae]'

          return (
            <div key={stage.value} className="flex shrink-0 items-center">
              <div
                className={`flex flex-col items-center gap-1 px-1.5 ${colorClass}`}
                title={stage.label}
              >
                <Icon className="size-4 shrink-0" />
                <span
                  className={
                    isCurrent
                      ? 'w-[72px] text-center text-[9.5px] font-semibold leading-tight'
                      : 'w-[72px] text-center text-[9.5px] font-medium leading-tight text-[#8a8578]'
                  }
                >
                  {stage.label}
                </span>
              </div>
              {index < PROCESS_CHECKPOINT_STAGES.length - 1 && (
                <div
                  className="h-px w-4 shrink-0"
                  style={{
                    backgroundColor: isPast ? '#1E3A47' : '#E2DAD0',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      {isFailure && (
        <p className="text-xs font-medium text-[#b91c1c]">
          Failed at this checkpoint — current Bot Status:{' '}
          {getBotStatusLabel(currentBotStatus)}
        </p>
      )}
    </section>
  )
}
