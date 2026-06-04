import { ref, uploadBytes } from 'firebase/storage'
import { makeStorageAssetPublic } from './make-storage-asset-public'
import { storage } from './firebase'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set(['image/svg+xml', 'image/png'])

const ICONS_STORAGE_PREFIX = 'icons'

export function validateVideoSubjectIconFile(file: File): string | undefined {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return 'Please upload an SVG or PNG icon.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Icon must be 2MB or smaller.'
  }

  return undefined
}

function getFileExtension(file: File): string {
  if (file.type === 'image/svg+xml') return 'svg'
  return 'png'
}

function buildIconStoragePath(subjectId: string, file: File): string {
  const extension = getFileExtension(file)
  return `${ICONS_STORAGE_PREFIX}/${subjectId}.${extension}`
}

export async function uploadVideoSubjectIcon(
  file: File,
  subjectId: string,
): Promise<string> {
  const validationError = validateVideoSubjectIconFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const trimmedSubjectId = subjectId.trim()
  if (!trimmedSubjectId) {
    throw new Error('Subject id is required to upload an icon.')
  }

  const storagePath = buildIconStoragePath(trimmedSubjectId, file)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file)
  return makeStorageAssetPublic(storagePath)
}
