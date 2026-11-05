import { Cr7de_closingticketdetailsescr109_botstatus } from '../../../generated/models/Cr7de_closingticketdetailsesModel'

/**
 * The bot-automation lifecycle's happy-path checkpoints, in the order a
 * ticket actually moves through them — NOT the raw Dataverse option-set
 * order (which is insertion order, not process order). Verified against
 * the exported solution's cloud/desktop flow dispatch filters; see
 * docs/PACKAGE_TYPE_PROCESS_FLOWS.md for the sourcing.
 */
export const PROCESS_CHECKPOINT_VALUES = [
  396620004, // Draft
  396620006, // Domecile Dump Retrieved
  396620000, // Seller Info Retrieved
  396620001, // Form Downloaded
  396620015, // Purchase Form Upload Onedrive
  396620013, // Purchase Form Data Extracted
  396620010, // RPTT Uploaded
  396620020, // RPTT Extracted
  396620011, // YARDI Charges Fetched
  396620021, // Yardi Charges Updated
  396620007, // Information Validated
  396620002, // Seller Details Updated
  396620003, // Owner Record Created
  396620022, // Sent To AR
] as const

export interface ProcessCheckpointStage {
  value: number
  label: string
}

export const PROCESS_CHECKPOINT_STAGES: ProcessCheckpointStage[] =
  PROCESS_CHECKPOINT_VALUES.map((value) => ({
    value,
    label:
      Cr7de_closingticketdetailsescr109_botstatus[
        value as keyof typeof Cr7de_closingticketdetailsescr109_botstatus
      ],
  }))

/**
 * Maps each "Failed ..." Bot Status to the happy-path checkpoint it failed
 * at, so a failed ticket can still be placed on the tracker instead of
 * falling off the end of it.
 */
export const FAILED_BOT_STATUS_CHECKPOINT: Record<number, number> = {
  396620009: 396620006, // Failed Domecile Dump Retrieval -> Domecile Dump Retrieved
  396620005: 396620000, // Failed Seller Info Retrieval -> Seller Info Retrieved
  396620008: 396620001, // Failed Form Download -> Form Downloaded
  396620016: 396620015, // Failed Purchase Form Upload Onedrive -> Purchase Form Upload Onedrive
  396620014: 396620013, // Failed Purchase Form Data Extraction -> Purchase Form Data Extracted
  396620019: 396620020, // Failed RPTT Extraction -> RPTT Extracted
  396620012: 396620011, // Failed Yardi Charges Fetch -> YARDI Charges Fetched
  396620017: 396620002, // Failed Seller Details Update -> Seller Details Updated
  396620018: 396620003, // Failed Create New Owner -> Owner Record Created
  396620024: 396620003, // Failed Create New Owner Backfill -> Owner Record Created
  396620023: 396620022, // Failed to Send to AR -> Sent To AR
}
