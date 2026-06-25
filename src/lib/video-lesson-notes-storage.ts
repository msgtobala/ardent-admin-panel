import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const PDF_MIME_TYPE = 'application/pdf'
const NOTES_FILE_NAME = 'notes.pdf'

export interface UploadVideoLessonNotesParams {
  subjectId: string
  lessonId: string
}

export function validateVideoLessonNotesFile(file: File): string | undefined {
  const isPdfMime = file.type === PDF_MIME_TYPE
  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf')

  if (!isPdfMime && !isPdfExtension) {
    return 'Please upload a PDF file.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'PDF must be 25MB or smaller.'
  }

  return undefined
}

export function buildVideoLessonNotesStoragePath(
  subjectId: string,
  lessonId: string,
): string {
  const trimmedSubjectId = subjectId.trim()
  const trimmedLessonId = lessonId.trim()

  if (!trimmedSubjectId || !trimmedLessonId) {
    throw new Error('Subject and lesson are required to upload notes.')
  }

  return `videos/${trimmedSubjectId}/lessons/${trimmedLessonId}/${NOTES_FILE_NAME}`
}

export async function uploadVideoLessonNotes(
  file: File,
  params: UploadVideoLessonNotesParams,
): Promise<string> {
  const validationError = validateVideoLessonNotesFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const storagePath = buildVideoLessonNotesStoragePath(params.subjectId, params.lessonId)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file, { contentType: PDF_MIME_TYPE })

  return storagePath
}

export async function deleteVideoLessonNotesFromPath(storagePath: string): Promise<void> {
  const trimmedPath = storagePath.trim()
  if (!trimmedPath) return

  const storageRef = ref(storage, trimmedPath)

  try {
    await deleteObject(storageRef)
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'storage/object-not-found'
    ) {
      return
    }

    throw error
  }
}

const DOWNLOAD_URL_ERROR_MESSAGES: Record<string, string> = {
  'storage/unauthorized': 'You do not have permission to view this PDF.',
  'storage/object-not-found': 'Notes file was not found in storage.',
}

function mapDownloadUrlError(error: unknown): string {
  if (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: string }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    const mapped = DOWNLOAD_URL_ERROR_MESSAGES[code]
    if (mapped) return mapped

    const message = error.message.trim()
    if (message) return message
  }

  return 'Failed to open notes PDF. Please try again.'
}

export async function getVideoLessonNotesDownloadUrl(storagePath: string): Promise<string> {
  const trimmedPath = storagePath.trim()
  if (!trimmedPath) {
    throw new Error('Notes file path is missing.')
  }

  try {
    return await getDownloadURL(ref(storage, trimmedPath))
  } catch (error) {
    throw new Error(mapDownloadUrlError(error), { cause: error })
  }
}
