import { listAll, ref, uploadBytes } from 'firebase/storage'
import { makeBannerImagePublic } from './make-banner-image-public'
import { storage } from './firebase'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg'])

const BANNERS_STORAGE_PREFIX = 'banners'

export function validateBannerImageFile(file: File): string | undefined {
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

function parseNumericBannerFileName(name: string): number | null {
  const match = /^(\d+)\.(png|jpg|jpeg)$/i.exec(name)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

export function buildBannerPublicUrl(fileName: string): string {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  if (!bucket) {
    throw new Error('Firebase storage bucket is not configured.')
  }
  return `https://storage.googleapis.com/${bucket}/${BANNERS_STORAGE_PREFIX}/${fileName}`
}

export async function getNextBannerImageFileName(file: File): Promise<string> {
  const extension = getFileExtension(file)
  const bannersRef = ref(storage, BANNERS_STORAGE_PREFIX)
  const listing = await listAll(bannersRef)

  let maxNumber = 0
  for (const item of listing.items) {
    const numeric = parseNumericBannerFileName(item.name)
    if (numeric !== null && numeric > maxNumber) {
      maxNumber = numeric
    }
  }

  return `${maxNumber + 1}.${extension}`
}

export async function uploadBannerImage(file: File): Promise<string> {
  const validationError = validateBannerImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const fileName = await getNextBannerImageFileName(file)
  const storagePath = `${BANNERS_STORAGE_PREFIX}/${fileName}`
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file)
  return makeBannerImagePublic(storagePath)
}
