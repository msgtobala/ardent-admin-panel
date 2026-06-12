import { deleteObject, ref, uploadBytes } from 'firebase/storage'

import { makeStorageAssetPublic } from './make-storage-asset-public'
import { storage } from './firebase'
import {
  parseStoragePathFromPublicUrl,
  sanitizeForStoragePath,
  validateQbankQuestionImageFile,
} from './qbank-question-image-storage'

const GRAND_TESTS_STORAGE_PREFIX = 'grand_tests'

export interface UploadGrandTestCustomQuestionImageParams {
  subjectId: string
  chapterId: string
  moduleName: string
  questionRefId: string
}

function getFileExtension(file: File): string {
  if (file.type === 'image/png') return 'png'
  return 'jpg'
}

function buildGrandTestCustomQuestionImageStoragePath(
  params: UploadGrandTestCustomQuestionImageParams,
  file: File,
): string {
  const subjectId = params.subjectId.trim()
  const chapterId = params.chapterId.trim()
  const questionRefId = params.questionRefId.trim()

  if (!subjectId || !chapterId || !questionRefId) {
    throw new Error('Subject, chapter, and question ID are required to upload an image.')
  }

  const moduleSegment = sanitizeForStoragePath(params.moduleName)
  const refSegment = sanitizeForStoragePath(questionRefId)
  const extension = getFileExtension(file)
  const fileName = `${refSegment}_question.${extension}`

  return [
    GRAND_TESTS_STORAGE_PREFIX,
    subjectId,
    moduleSegment,
    chapterId,
    'questions',
    fileName,
  ].join('/')
}

function buildGrandTestCustomCorrectAnswerImageFileName(
  refSegment: string,
  extension: string,
  imageIndex: number,
  totalCount: number,
): string {
  const suffix = totalCount === 1 ? 'answer' : `answer_${imageIndex}`
  return `${refSegment}_${suffix}.${extension}`
}

function buildGrandTestCustomCorrectAnswerImageStoragePath(
  params: UploadGrandTestCustomQuestionImageParams,
  file: File,
  imageIndex: number,
  totalCount: number,
): string {
  const subjectId = params.subjectId.trim()
  const chapterId = params.chapterId.trim()
  const questionRefId = params.questionRefId.trim()

  if (!subjectId || !chapterId || !questionRefId) {
    throw new Error('Subject, chapter, and question ID are required to upload an image.')
  }

  if (imageIndex < 0 || totalCount < 1 || imageIndex >= totalCount) {
    throw new Error('Invalid correct answer image index.')
  }

  const moduleSegment = sanitizeForStoragePath(params.moduleName)
  const refSegment = sanitizeForStoragePath(questionRefId)
  const extension = getFileExtension(file)
  const fileName = buildGrandTestCustomCorrectAnswerImageFileName(
    refSegment,
    extension,
    imageIndex,
    totalCount,
  )

  return [
    GRAND_TESTS_STORAGE_PREFIX,
    subjectId,
    moduleSegment,
    chapterId,
    'questions',
    fileName,
  ].join('/')
}

function isStorageObjectNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'storage/object-not-found'
  )
}

export async function deleteGrandTestCustomQuestionImageFromUrl(
  publicUrl: string,
): Promise<void> {
  const storagePath = parseStoragePathFromPublicUrl(publicUrl)
  if (!storagePath?.startsWith(`${GRAND_TESTS_STORAGE_PREFIX}/`)) return

  const storageRef = ref(storage, storagePath)

  try {
    await deleteObject(storageRef)
  } catch (error) {
    if (isStorageObjectNotFound(error)) return
    throw error
  }
}

export async function deleteGrandTestCustomQuestionImages(
  imageUrls: string[],
): Promise<void> {
  const uniqueUrls = [
    ...new Set(imageUrls.map((imageUrl) => imageUrl.trim()).filter((imageUrl) => imageUrl)),
  ]

  if (uniqueUrls.length === 0) return

  await Promise.all(
    uniqueUrls.map((imageUrl) => deleteGrandTestCustomQuestionImageFromUrl(imageUrl)),
  )
}

export async function uploadGrandTestCustomQuestionImage(
  file: File,
  params: UploadGrandTestCustomQuestionImageParams,
): Promise<string> {
  const validationError = validateQbankQuestionImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const storagePath = buildGrandTestCustomQuestionImageStoragePath(params, file)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file)
  return makeStorageAssetPublic(storagePath)
}

export async function uploadGrandTestCustomCorrectAnswerImage(
  file: File,
  params: UploadGrandTestCustomQuestionImageParams,
  imageIndex: number,
  totalCount: number,
): Promise<string> {
  const validationError = validateQbankQuestionImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const storagePath = buildGrandTestCustomCorrectAnswerImageStoragePath(
    params,
    file,
    imageIndex,
    totalCount,
  )
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file)
  return makeStorageAssetPublic(storagePath)
}
