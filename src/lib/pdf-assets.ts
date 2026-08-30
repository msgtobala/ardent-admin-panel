import { getBytes, ref } from 'firebase/storage'

import { storage } from '@/lib/firebase'
import { parseFirebaseStoragePathFromUrl } from '@/lib/firebase-storage-url'

export interface PdfImageAsset {
  dataUrl: string
  format: 'JPEG' | 'PNG'
  width: number
  height: number
}

function detectImageFormatFromMime(mimeType: string): PdfImageAsset['format'] | 'WEBP' | null {
  const normalized = mimeType.toLowerCase()
  if (normalized.includes('png')) return 'PNG'
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'JPEG'
  if (normalized.includes('webp')) return 'WEBP'
  return null
}

function detectImageFormatFromUrl(url: string): PdfImageAsset['format'] | 'WEBP' | null {
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  if (path.endsWith('.png')) return 'PNG'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'JPEG'
  if (path.endsWith('.webp')) return 'WEBP'
  return null
}

function detectImageFormatFromBytes(bytes: Uint8Array): PdfImageAsset['format'] | 'WEBP' | null {
  if (bytes.length >= 8) {
    // PNG signature
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return 'PNG'
    }

    // JPEG signature
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'JPEG'
    }

    // WEBP: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return 'WEBP'
    }
  }

  return null
}

function readImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => reject(new Error('Failed to read image dimensions'))
    image.src = dataUrl
  })
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Failed to convert blob to data URL'))
    }
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    for (let offset = 0; offset < chunk.length; offset += 1) {
      binary += String.fromCharCode(chunk[offset] ?? 0)
    }
  }

  return btoa(binary)
}

async function convertImageDataUrlToJpeg(dataUrl: string): Promise<{
  dataUrl: string
  width: number
  height: number
} | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      const context = canvas.getContext('2d')
      if (!context) {
        resolve(null)
        return
      }

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0)

      try {
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
          width: image.naturalWidth,
          height: image.naturalHeight,
        })
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}

async function buildPdfImageAssetFromBytes(
  bytes: Uint8Array,
  mimeType: string,
  sourceUrl: string,
): Promise<PdfImageAsset | null> {
  const detectedFormat =
    detectImageFormatFromMime(mimeType) ??
    detectImageFormatFromBytes(bytes) ??
    detectImageFormatFromUrl(sourceUrl)

  if (!detectedFormat) return null

  const mimeForDataUrl =
    detectedFormat === 'PNG'
      ? 'image/png'
      : detectedFormat === 'JPEG'
        ? 'image/jpeg'
        : 'image/webp'

  const dataUrl = `data:${mimeForDataUrl};base64,${uint8ArrayToBase64(bytes)}`

  if (detectedFormat === 'WEBP') {
    const converted = await convertImageDataUrlToJpeg(dataUrl)
    if (!converted || converted.width <= 0 || converted.height <= 0) return null

    return {
      dataUrl: converted.dataUrl,
      format: 'JPEG',
      width: converted.width,
      height: converted.height,
    }
  }

  const { width, height } = await readImageDimensions(dataUrl)
  if (width <= 0 || height <= 0) return null

  return { dataUrl, format: detectedFormat, width, height }
}

export { parseFirebaseStoragePathFromUrl } from '@/lib/firebase-storage-url'

async function loadImageBytesFromFirebaseStorage(
  storagePath: string,
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  try {
    const bytes = await getBytes(ref(storage, storagePath))
    return { bytes: new Uint8Array(bytes), mimeType: '' }
  } catch {
    return null
  }
}

async function loadImageBytesFromFetch(
  url: string,
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) return null

    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    return { bytes: new Uint8Array(buffer), mimeType: blob.type }
  } catch {
    return null
  }
}

export async function loadPdfImageAsset(url: string): Promise<PdfImageAsset | null> {
  if (!url.trim()) return null

  try {
    const storagePath = parseFirebaseStoragePathFromUrl(url)
    const loaded = storagePath
      ? ((await loadImageBytesFromFirebaseStorage(storagePath)) ??
        (await loadImageBytesFromFetch(url)))
      : await loadImageBytesFromFetch(url)

    if (!loaded) return null

    return buildPdfImageAssetFromBytes(loaded.bytes, loaded.mimeType, url)
  } catch {
    return null
  }
}

export async function loadPdfImageAssetFromUrl(url: string): Promise<PdfImageAsset | null> {
  if (!url.trim()) return null

  try {
    // Local Vite assets / relative URLs (e.g. logo) — fetch is fine and preferred.
    if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) {
      const response = await fetch(url)
      if (!response.ok) return null

      const blob = await response.blob()
      const dataUrl = await blobToDataUrl(blob)
      const format =
        detectImageFormatFromMime(blob.type) === 'PNG'
          ? 'PNG'
          : detectImageFormatFromMime(blob.type) === 'JPEG'
            ? 'JPEG'
            : 'PNG'
      const { width, height } = await readImageDimensions(dataUrl)

      if (width <= 0 || height <= 0) return null
      return { dataUrl, format, width, height }
    }

    return loadPdfImageAsset(url)
  } catch {
    return null
  }
}

export async function preloadPdfImageAssets(
  urls: string[],
): Promise<Map<string, PdfImageAsset>> {
  const uniqueUrls = [...new Set(urls.filter((url) => url.trim().length > 0))]
  const entries = await Promise.all(
    uniqueUrls.map(async (url) => {
      const asset = await loadPdfImageAsset(url)
      return [url, asset] as const
    }),
  )

  const assets = new Map<string, PdfImageAsset>()
  for (const [url, asset] of entries) {
    if (asset) assets.set(url, asset)
  }

  return assets
}

export type PdfFontWeight = 'regular' | 'medium' | 'semibold' | 'bold'

export type PdfFontFamily = 'OpenSans' | 'helvetica'

export interface PdfFontSet {
  family: PdfFontFamily
  regular: string
  medium: string
  semibold: string
  bold: string
}

const HELVETICA_FONT_SET: PdfFontSet = {
  family: 'helvetica',
  regular: 'helvetica',
  medium: 'helvetica',
  semibold: 'helvetica',
  bold: 'helvetica',
}

const OPEN_SANS_FONT_FILES = {
  regular: '/fonts/open-sans/OpenSans-Regular.ttf',
  medium: '/fonts/open-sans/OpenSans-Medium.ttf',
  semibold: '/fonts/open-sans/OpenSans-SemiBold.ttf',
  bold: '/fonts/open-sans/OpenSans-Bold.ttf',
} as const

async function fetchFontAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''

    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index] ?? 0)
    }

    return btoa(binary)
  } catch {
    return null
  }
}

export function resolvePdfFontStyle(
  fonts: PdfFontSet,
  weight: PdfFontWeight,
): { fontName: string; fontStyle: 'normal' | 'bold' } {
  if (fonts.family === 'helvetica') {
    return {
      fontName: 'helvetica',
      fontStyle: weight === 'bold' || weight === 'semibold' ? 'bold' : 'normal',
    }
  }

  return { fontName: fonts[weight], fontStyle: 'normal' }
}

export async function registerPdfFonts(doc: {
  addFileToVFS: (fileName: string, fileContent: string) => void
  addFont: (postScriptName: string, fontName: string, fontStyle: string) => string
}): Promise<PdfFontSet> {
  const [regular, medium, semibold, bold] = await Promise.all([
    fetchFontAsBase64(OPEN_SANS_FONT_FILES.regular),
    fetchFontAsBase64(OPEN_SANS_FONT_FILES.medium),
    fetchFontAsBase64(OPEN_SANS_FONT_FILES.semibold),
    fetchFontAsBase64(OPEN_SANS_FONT_FILES.bold),
  ])

  if (!regular || !medium || !semibold || !bold) {
    return HELVETICA_FONT_SET
  }

  try {
    doc.addFileToVFS('OpenSans-Regular.ttf', regular)
    doc.addFileToVFS('OpenSans-Medium.ttf', medium)
    doc.addFileToVFS('OpenSans-SemiBold.ttf', semibold)
    doc.addFileToVFS('OpenSans-Bold.ttf', bold)

    doc.addFont('OpenSans-Regular.ttf', 'OpenSans-Regular', 'normal')
    doc.addFont('OpenSans-Medium.ttf', 'OpenSans-Medium', 'normal')
    doc.addFont('OpenSans-SemiBold.ttf', 'OpenSans-SemiBold', 'normal')
    doc.addFont('OpenSans-Bold.ttf', 'OpenSans-Bold', 'normal')

    return {
      family: 'OpenSans',
      regular: 'OpenSans-Regular',
      medium: 'OpenSans-Medium',
      semibold: 'OpenSans-SemiBold',
      bold: 'OpenSans-Bold',
    }
  } catch {
    return HELVETICA_FONT_SET
  }
}
