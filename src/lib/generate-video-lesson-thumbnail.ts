import { httpsCallable } from 'firebase/functions'
import type { ThumbnailGenerationConfig } from '@/types/thumbnail-generation'
import { functions } from './functions'

interface GenerateVideoLessonThumbnailBaseInput extends ThumbnailGenerationConfig {
  subjectId: string
}

interface GenerateVideoLessonThumbnailSingleInput
  extends GenerateVideoLessonThumbnailBaseInput {
  lessonId: string
}

interface GenerateVideoLessonThumbnailBulkInput
  extends GenerateVideoLessonThumbnailBaseInput {
  onlyMissing?: boolean
}

interface GenerateVideoLessonThumbnailSingleResult {
  mode: 'single'
  lessonId: string
  thumbnailImage: string
}

export interface BulkThumbnailItemResult {
  lessonId: string
  lessonName: string
  status: 'success' | 'skipped' | 'error'
  thumbnailImage?: string
  message?: string
}

interface GenerateVideoLessonThumbnailBulkResult {
  mode: 'bulk'
  processed: number
  successCount: number
  skippedCount: number
  errorCount: number
  results: BulkThumbnailItemResult[]
}

type GenerateVideoLessonThumbnailResult =
  | GenerateVideoLessonThumbnailSingleResult
  | GenerateVideoLessonThumbnailBulkResult

const generateVideoLessonThumbnailCallable = httpsCallable<
  GenerateVideoLessonThumbnailSingleInput | GenerateVideoLessonThumbnailBulkInput,
  GenerateVideoLessonThumbnailResult
>(functions, 'generateVideoLessonThumbnail')

const CALLABLE_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/not-found': 'Lesson was not found.',
  'functions/failed-precondition':
    'This lesson does not have a linked Mux video yet.',
  'functions/invalid-argument': 'Invalid thumbnail generation request.',
}

function mapCallableError(error: unknown): string {
  if (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: string }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    return CALLABLE_ERROR_MESSAGES[code] ?? error.message
  }

  return 'Failed to generate thumbnail. Please try again.'
}

export async function generateVideoLessonThumbnail(
  subjectId: string,
  lessonId: string,
  config: ThumbnailGenerationConfig,
): Promise<string> {
  try {
    const result = await generateVideoLessonThumbnailCallable({
      subjectId,
      lessonId,
      thumbnailWidth: config.thumbnailWidth,
      thumbnailTime: config.thumbnailTime,
      compress: config.compress,
    })
    const data = result.data

    if (!data || data.mode !== 'single' || !data.thumbnailImage) {
      throw new Error('Invalid response from server.')
    }

    return data.thumbnailImage
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}

export async function generateMissingVideoLessonThumbnails(
  subjectId: string,
  config: ThumbnailGenerationConfig,
): Promise<GenerateVideoLessonThumbnailBulkResult> {
  try {
    const result = await generateVideoLessonThumbnailCallable({
      subjectId,
      onlyMissing: true,
      thumbnailWidth: config.thumbnailWidth,
      thumbnailTime: config.thumbnailTime,
      compress: config.compress,
    })
    const data = result.data

    if (!data || data.mode !== 'bulk') {
      throw new Error('Invalid response from server.')
    }

    return data
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}
