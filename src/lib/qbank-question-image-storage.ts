import { deleteObject, ref, uploadBytes } from 'firebase/storage'
import { makeStorageAssetPublic } from './make-storage-asset-public'
import { storage } from './firebase'
import { parseFirebaseStoragePathFromUrl } from './firebase-storage-url'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg'])

const QBANKS_STORAGE_PREFIX = 'qbanks'

const DEFAULT_MODULE_SEGMENT = 'general'

export interface UploadQbankQuestionImageParams {
  subjectId: string
  chapterId: string
  moduleName: string
  questionRefId: string
}

export function validateQbankQuestionImageFile(file: File): string | undefined {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return 'Please upload a PNG, JPG, or JPEG image.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Image must be 5MB or smaller.'
  }

  return undefined
}

function getFileExtension(file: File): string {
  if (file.type === 'image/png') return 'png'
  return 'jpg'
}

export function sanitizeForStoragePath(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '_')

  return sanitized || DEFAULT_MODULE_SEGMENT
}

export function buildQbankQuestionImageStoragePath(
  params: UploadQbankQuestionImageParams,
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
    QBANKS_STORAGE_PREFIX,
    subjectId,
    moduleSegment,
    chapterId,
    'questions',
    fileName,
  ].join('/')
}

export function parseStoragePathFromPublicUrl(publicUrl: string): string | null {
  return parseFirebaseStoragePathFromUrl(publicUrl)
}

function isStorageObjectNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'storage/object-not-found'
  )
}

export async function deleteQbankQuestionImageFromUrl(publicUrl: string): Promise<void> {
  const storagePath = parseStoragePathFromPublicUrl(publicUrl)
  if (!storagePath?.startsWith(`${QBANKS_STORAGE_PREFIX}/`)) return

  const storageRef = ref(storage, storagePath)

  try {
    await deleteObject(storageRef)
  } catch (error) {
    if (isStorageObjectNotFound(error)) return
    throw error
  }
}

export function collectQbankQuestionImageUrls(question: {
  questionImage: string | null
  correctAnswerImages: string[]
}): string[] {
  const urls = new Set<string>()

  const questionImage = question.questionImage?.trim()
  if (questionImage) urls.add(questionImage)

  for (const imageUrl of question.correctAnswerImages) {
    const trimmed = imageUrl.trim()
    if (trimmed) urls.add(trimmed)
  }

  return [...urls]
}

export async function deleteQbankQuestionImages(question: {
  questionImage: string | null
  correctAnswerImages: string[]
}): Promise<void> {
  const imageUrls = collectQbankQuestionImageUrls(question)
  if (imageUrls.length === 0) return

  await Promise.all(imageUrls.map((imageUrl) => deleteQbankQuestionImageFromUrl(imageUrl)))
}

export async function uploadQbankQuestionImage(
  file: File,
  params: UploadQbankQuestionImageParams,
): Promise<string> {
  const validationError = validateQbankQuestionImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const storagePath = buildQbankQuestionImageStoragePath(params, file)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file)
  return makeStorageAssetPublic(storagePath)
}

function buildQbankCorrectAnswerImageFileName(
  refSegment: string,
  extension: string,
  imageIndex: number,
  totalCount: number,
): string {
  const suffix = totalCount === 1 ? 'answer' : `answer_${imageIndex}`
  return `${refSegment}_${suffix}.${extension}`
}

export function buildQbankCorrectAnswerImageStoragePath(
  params: UploadQbankQuestionImageParams,
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
  const fileName = buildQbankCorrectAnswerImageFileName(
    refSegment,
    extension,
    imageIndex,
    totalCount,
  )

  return [
    QBANKS_STORAGE_PREFIX,
    subjectId,
    moduleSegment,
    chapterId,
    'questions',
    fileName,
  ].join('/')
}

export async function uploadQbankCorrectAnswerImage(
  file: File,
  params: UploadQbankQuestionImageParams,
  imageIndex: number,
  totalCount: number,
): Promise<string> {
  const validationError = validateQbankQuestionImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const storagePath = buildQbankCorrectAnswerImageStoragePath(
    params,
    file,
    imageIndex,
    totalCount,
  )
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file)
  return makeStorageAssetPublic(storagePath)
}
