import { useEffect, useState } from 'react'
import { getChangeLogs } from '../../auditLog/api/auditLogService'
import type { ClosingTicketRecord } from '../types/closingTicket'

const TRANSFERRING_BUILDING_STATUS = 716070002
const COMPLETED_STATUS = 716070008
const SENT_TO_AR_STATUS = 396620001
const CLOSED_STATUSES = [COMPLETED_STATUS, SENT_TO_AR_STATUS]

const WINDOW_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// A generous cap on how much update history to scan. The record itself
// doesn't store these status-transition timestamps — only the audit log
// does — so this is the best available signal, not a guaranteed-complete
// one (very old transitions can fall outside this window).
const LOG_SCAN_LIMIT = 5000

export interface DurationStat {
  averageDays: number | null
  sampleSize: number
}

interface ClosingPipelineDurations {
  /** createdon -> Completed/Sent to AR, for tickets that closed in the last 30 days. */
  timeToClose: DurationStat
  /** Transferring Building -> Completed, for tickets completed in the last 30 days. */
  yardiOwnerCreation: DurationStat
  loading: boolean
}

function setEarliest(
  map: Map<string, number>,
  key: string,
  timestamp: number
) {
  const existing = map.get(key)
  if (existing === undefined || timestamp < existing) {
    map.set(key, timestamp)
  }
}

function toDurationStat(durationsMs: number[]): DurationStat {
  if (durationsMs.length === 0) {
    return { averageDays: null, sampleSize: 0 }
  }
  const averageMs =
    durationsMs.reduce((sum, ms) => sum + ms, 0) / durationsMs.length
  return {
    averageDays: averageMs / DAY_MS,
    sampleSize: durationsMs.length,
  }
}

/**
 * Two rolling 30-day pipeline-health metrics, both derived from the audit
 * log's earliest-status-transition timestamps (the record itself only
 * stores its current status, not when it got there):
 *
 * - timeToClose: createdon -> the ticket first reaching Completed/Sent to
 *   AR, counted only for tickets that closed within the last 30 days.
 * - yardiOwnerCreation: Transferring Building -> Completed, i.e. how long
 *   the Yardi new-owner-record step is taking, counted only for tickets
 *   completed within the last 30 days.
 *
 * Both only count tickets where the relevant transition was actually
 * captured by an in-app update (writeChangeLog) — a ticket whose status
 * changed entirely via a bot/flow writing straight to Dataverse won't have
 * a matching log entry and is excluded rather than guessed at.
 */
export function useClosingPipelineDurations(
  records: ClosingTicketRecord[]
): ClosingPipelineDurations {
  const [result, setResult] = useState<ClosingPipelineDurations>({
    timeToClose: { averageDays: null, sampleSize: 0 },
    yardiOwnerCreation: { averageDays: null, sampleSize: 0 },
    loading: true,
  })

  useEffect(() => {
    let isMounted = true

    async function compute() {
      setResult((current) => ({ ...current, loading: true }))

      try {
        const logs = await getChangeLogs({
          tableName: 'cr7de_closingticketdetailses',
          operation: 'update',
          limit: LOG_SCAN_LIMIT,
        })

        const closedAt = new Map<string, number>()
        const transferringAt = new Map<string, number>()
        const completedAt = new Map<string, number>()

        for (const log of logs) {
          const newStatus = Number(log.newData?.cr7de_ticketstatus)
          const timestamp = new Date(log.createdOn).getTime()
          if (Number.isNaN(timestamp)) continue

          if (CLOSED_STATUSES.includes(newStatus)) {
            setEarliest(closedAt, log.ticketId, timestamp)
          }
          if (newStatus === TRANSFERRING_BUILDING_STATUS) {
            setEarliest(transferringAt, log.ticketId, timestamp)
          }
          if (newStatus === COMPLETED_STATUS) {
            setEarliest(completedAt, log.ticketId, timestamp)
          }
        }

        const windowStart = Date.now() - WINDOW_DAYS * DAY_MS

        const closeDurationsMs: number[] = []
        for (const record of records) {
          const ticketId = record.cr7de_ticketid
          if (!ticketId || !record.createdon) continue

          const closedTimestamp = closedAt.get(ticketId)
          if (closedTimestamp === undefined) continue
          if (closedTimestamp < windowStart) continue

          const createdTimestamp = new Date(record.createdon).getTime()
          if (Number.isNaN(createdTimestamp)) continue

          const durationMs = closedTimestamp - createdTimestamp
          if (durationMs >= 0) closeDurationsMs.push(durationMs)
        }

        const yardiDurationsMs: number[] = []
        for (const record of records) {
          const ticketId = record.cr7de_ticketid
          if (!ticketId) continue

          const transferTimestamp = transferringAt.get(ticketId)
          const completeTimestamp = completedAt.get(ticketId)
          if (
            transferTimestamp === undefined ||
            completeTimestamp === undefined
          ) {
            continue
          }
          if (completeTimestamp < windowStart) continue

          const durationMs = completeTimestamp - transferTimestamp
          if (durationMs >= 0) yardiDurationsMs.push(durationMs)
        }

        if (!isMounted) return

        setResult({
          timeToClose: toDurationStat(closeDurationsMs),
          yardiOwnerCreation: toDurationStat(yardiDurationsMs),
          loading: false,
        })
      } catch {
        if (isMounted) {
          setResult({
            timeToClose: { averageDays: null, sampleSize: 0 },
            yardiOwnerCreation: { averageDays: null, sampleSize: 0 },
            loading: false,
          })
        }
      }
    }

    void compute()

    return () => {
      isMounted = false
    }
  }, [records])

  return result
}
