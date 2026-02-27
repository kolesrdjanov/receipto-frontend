export type ScanFlowState =
  | 'idle'
  | 'camera_loading'
  | 'scanning'
  | 'submitting'
  | 'retrying_portal'
  | 'failed_terminal'
  | 'success'

export interface RetryMeta {
  attempt: number
  maxAttempts: number
  nextDelayMs: number
  startedAt: number
}
