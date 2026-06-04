import { UpChunk } from '@mux/upchunk'
import { httpsCallable } from 'firebase/functions'
import { clearMuxPlaybackCache } from '@/lib/mux-playback'
import {
  fetchVideoLesson,
  updateVideoLessonMuxAssetStatus,
} from '@/lib/video-lessons'
import { MUX_ASSET_STATUS } from '@/types/video-lesson'
import type {
  CreateMuxDirectUploadInput,
  CreateMuxDirectUploadResult,
} from '@/types/mux-video-upload'
import { functions } from './functions'

const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']

const DEFAULT_STATUS_TIMEOUT_MS = 20 * 60 * 1000
const DEFAULT_STATUS_POLL_INTERVAL_MS = 3000

const UPCHUNK_CHUNK_SIZE_KB = 5120

const inFlightLessonUploads = new Set<string>()

const createMuxDirectUploadCallable = httpsCallable<
  CreateMuxDirectUploadInput,
  CreateMuxDirectUploadResult | Record<string, unknown>
>(functions, 'createMuxDirectUpload')

const CALLABLE_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/invalid-argument': 'Invalid lesson details for video upload.',
  'functions/not-found': 'Lesson was not found.',
  'functions/internal': 'Failed to start video upload. Please try again.',
}

function mapCallableError(error: unknown): string {
  if (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: string }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    const mapped = CALLABLE_ERROR_MESSAGES[code]
    if (mapped) return mapped

    const message = error.message.trim()
    if (message) return message
  }

  return 'Failed to start video upload. Please try again.'
}

function isVideoExtension(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase()
  return ALLOWED_VIDEO_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

export function validateVideoLessonFile(file: File): string | undefined {
  if (!ALLOWED_VIDEO_MIME_TYPES.has(file.type) && !isVideoExtension(file.name)) {
    return 'Please upload an MP4, MOV, or WebM video.'
  }

  if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    return 'Video must be 500MB or smaller.'
  }

  if (file.size <= 0) {
    return 'Selected file is empty.'
  }

  return undefined
}

function readStringField(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

function extractUploadCredentials(payload: unknown): CreateMuxDirectUploadResult {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid response from server.')
  }

  const response = payload as Record<string, unknown>
  const nested = response.result ?? response.data
  const source =
    nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : response

  const uploadUrl = readStringField(source, ['uploadUrl', 'upload_url', 'url'])
  const uploadId = readStringField(source, ['uploadId', 'upload_id', 'id'])

  if (!uploadUrl || !uploadId) {
    throw new Error('Upload URL was not returned by the server.')
  }

  return { uploadUrl, uploadId }
}

function resolveMuxCorsOrigin(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin?.trim()
    if (origin) return origin
  }

  const fromEnv = import.meta.env.VITE_MUX_CORS_ORIGIN?.trim()
  if (fromEnv) return fromEnv

  throw new Error('Could not determine CORS origin for video upload.')
}

export async function createMuxDirectUpload(
  input: CreateMuxDirectUploadInput,
): Promise<CreateMuxDirectUploadResult> {
  const subjectId = input.subjectId.trim()
  const lessonId = input.lessonId.trim()

  if (!subjectId || !lessonId) {
    throw new Error('Subject and lesson are required to upload a video.')
  }

  try {
    const corsOrigin = input.corsOrigin?.trim() || resolveMuxCorsOrigin()

    const result = await createMuxDirectUploadCallable({
      subjectId,
      lessonId,
      previousMuxAssetId: input.previousMuxAssetId?.trim() ?? '',
      corsOrigin,
    })
    return extractUploadCredentials(result.data)
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Polls Firestore until the webhook sets muxAssetStatus to ready or errored. */
export async function waitForLessonMuxAssetStatus(
  subjectId: string,
  lessonId: string,
  options?: {
    timeoutMs?: number
    intervalMs?: number
  },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_STATUS_TIMEOUT_MS
  const intervalMs = options?.intervalMs ?? DEFAULT_STATUS_POLL_INTERVAL_MS
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const lesson = await fetchVideoLesson(subjectId, lessonId)

    if (lesson?.muxAssetStatus === MUX_ASSET_STATUS.ready) {
      return
    }

    if (lesson?.muxAssetStatus === MUX_ASSET_STATUS.errored) {
      throw new Error(
        lesson.muxAssetError?.trim() ||
          'Video processing failed. Please try uploading again.',
      )
    }

    await sleep(intervalMs)
  }

  throw new Error(
    'Video processing is taking longer than expected. Check the lesson again shortly.',
  )
}

export interface UploadVideoLessonFileOptions {
  subjectId: string
  lessonId: string
  previousMuxAssetId?: string
  file: File
  onProgress?: (percent: number) => void
  onUploadComplete?: () => void
}

export async function uploadVideoLessonFile({
  subjectId,
  lessonId,
  previousMuxAssetId,
  file,
  onProgress,
  onUploadComplete,
}: UploadVideoLessonFileOptions): Promise<void> {
  const validationError = validateVideoLessonFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const trimmedSubjectId = subjectId.trim()
  const trimmedLessonId = lessonId.trim()
  if (!trimmedSubjectId || !trimmedLessonId) {
    throw new Error('Subject and lesson are required to upload a video.')
  }

  const uploadKey = `${trimmedSubjectId}:${trimmedLessonId}`
  if (inFlightLessonUploads.has(uploadKey)) {
    throw new Error('A video upload is already in progress for this lesson.')
  }
  inFlightLessonUploads.add(uploadKey)

  try {
    await updateVideoLessonMuxAssetStatus(
      trimmedSubjectId,
      trimmedLessonId,
      MUX_ASSET_STATUS.processing,
    )

    const { uploadUrl } = await createMuxDirectUpload({
      subjectId: trimmedSubjectId,
      lessonId: trimmedLessonId,
      previousMuxAssetId: previousMuxAssetId?.trim() ?? '',
    })

    await new Promise<void>((resolve, reject) => {
      const upload = UpChunk.createUpload({
        endpoint: uploadUrl,
        file,
        chunkSize: UPCHUNK_CHUNK_SIZE_KB,
      })

      upload.on('progress', (progress) => {
        onProgress?.(Math.round(progress.detail))
      })

      upload.on('success', () => {
        resolve()
      })

      upload.on('error', (error) => {
        const message = error.detail?.message?.trim()
        reject(new Error(message || 'Video upload failed. Please try again.'))
      })
    })

    onUploadComplete?.()
    await waitForLessonMuxAssetStatus(trimmedSubjectId, trimmedLessonId)
    clearMuxPlaybackCache(trimmedSubjectId, trimmedLessonId)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Video upload failed. Please try again.'

    try {
      await updateVideoLessonMuxAssetStatus(
        trimmedSubjectId,
        trimmedLessonId,
        MUX_ASSET_STATUS.errored,
        { errorMessage: message },
      )
    } catch {
      // Webhook or a later retry may still update the lesson.
    }

    throw new Error(message, { cause: error })
  } finally {
    inFlightLessonUploads.delete(uploadKey)
  }
}
