import { Cr7de_closingticketdetailsescr109_processcheckpoint } from '../../../generated/models/Cr7de_closingticketdetailsesModel'

/**
 * The real Dataverse "Process Checkpoint" field (`cr109_processcheckpoint`,
 * global choice "Create New Owner Checkpoint") — a multi-select tracking
 * which New Owner Ticket sub-steps have been completed for a closing
 * (Buyer/Occupant Added, Document Uploaded, Ledgers Added, etc). A ticket
 * can have any number of these set at once, so this is a checklist, not a
 * single current stage.
 */
export interface ProcessCheckpointOption {
  value: number
  label: string
}

export const PROCESS_CHECKPOINT_OPTIONS: ProcessCheckpointOption[] =
  Object.entries(
    Cr7de_closingticketdetailsescr109_processcheckpoint
  ).map(([value, label]) => ({
    value: Number(value),
    // A couple of the Dataverse labels have a trailing space
    // ("Additional Occupant 1 Added ") — trim for display.
    label: label.trim(),
  }))
