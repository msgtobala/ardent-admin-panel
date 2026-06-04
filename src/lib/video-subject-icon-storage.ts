import { ref, uploadBytes } from 'firebase/storage'
import { makeStorageAssetPublic } from './make-storage-asset-public'
import { storage } from './firebase'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

const ICONS_STORAGE_PREFIX = 'icons'

function isSvgFile(file: File): boolean {
  if (file.type === 'image/svg+xml') return true
  return file.name.trim().toLowerCase().endsWith('.svg')
}

export function validateVideoSubjectIconFile(file: File): string | undefined {
  if (!isSvgFile(file)) {
    return 'Please upload an SVG icon only.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Icon must be 2MB or smaller.'
  }

  return undefined
}

function buildIconStoragePath(subjectId: string): string {
  return `${ICONS_STORAGE_PREFIX}/${subjectId}.svg`
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

  const storagePath = buildIconStoragePath(trimmedSubjectId)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file, {
    contentType: 'image/svg+xml',
  })
  return makeStorageAssetPublic(storagePath)
}
