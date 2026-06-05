import { ref, uploadBytes } from 'firebase/storage'
import { makeStorageAssetPublic } from './make-storage-asset-public'
import { storage } from './firebase'
import {
  deleteQbankQuestionImageFromUrl,
  sanitizeForStoragePath,
  validateQbankQuestionImageFile,
} from './qbank-question-image-storage'

const QBANKS_STORAGE_PREFIX = 'qbanks'

export interface UploadQbankChapterImageParams {
  subjectId: string
  chapterId: string
  moduleName: string
}

function getFileExtension(file: File): string {
  if (file.type === 'image/png') return 'png'
  return 'jpg'
}

export function buildQbankChapterImageStoragePath(
  params: UploadQbankChapterImageParams,
  file: File,
): string {
  const subjectId = params.subjectId.trim()
  const chapterId = params.chapterId.trim()

  if (!subjectId || !chapterId) {
    throw new Error('Subject and chapter are required to upload an image.')
  }

  const moduleSegment = sanitizeForStoragePath(params.moduleName)
  const chapterSegment = sanitizeForStoragePath(chapterId)
  const extension = getFileExtension(file)
  const fileName = `${chapterSegment}_chapter.${extension}`

  return [QBANKS_STORAGE_PREFIX, subjectId, moduleSegment, chapterId, fileName].join('/')
}

export async function deleteQbankChapterImageFromUrl(publicUrl: string): Promise<void> {
  return deleteQbankQuestionImageFromUrl(publicUrl)
}

export async function uploadQbankChapterImage(
  file: File,
  params: UploadQbankChapterImageParams,
): Promise<string> {
  const validationError = validateQbankQuestionImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const storagePath = buildQbankChapterImageStoragePath(params, file)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file)
  return makeStorageAssetPublic(storagePath)
}
