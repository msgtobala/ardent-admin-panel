export interface CreateMuxDirectUploadInput {
  subjectId: string
  lessonId: string
  previousMuxAssetId: string
  /** Browser origin for Mux direct upload; defaults to window.location.origin. */
  corsOrigin?: string
}

export interface CreateMuxDirectUploadResult {
  uploadUrl: string
  uploadId: string
}

export type VideoLessonUploadPhase =
  | 'idle'
  | 'selected'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error'
