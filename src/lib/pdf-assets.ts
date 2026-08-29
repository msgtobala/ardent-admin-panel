export interface PdfImageAsset {
  dataUrl: string
  format: 'JPEG' | 'PNG' | 'WEBP'
  width: number
  height: number
}

function detectImageFormat(mimeType: string): PdfImageAsset['format'] | null {
  if (mimeType.includes('png')) return 'PNG'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPEG'
  if (mimeType.includes('webp')) return 'WEBP'
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

export async function loadPdfImageAsset(url: string): Promise<PdfImageAsset | null> {
  if (!url.trim()) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const blob = await response.blob()
    const format = detectImageFormat(blob.type)
    if (!format) return null

    const dataUrl = await blobToDataUrl(blob)
    const { width, height } = await readImageDimensions(dataUrl)

    if (width <= 0 || height <= 0) return null

    return { dataUrl, format, width, height }
  } catch {
    return null
  }
}

export async function loadPdfImageAssetFromUrl(url: string): Promise<PdfImageAsset | null> {
  if (!url.trim()) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const blob = await response.blob()
    const format = detectImageFormat(blob.type) ?? 'PNG'
    const dataUrl = await blobToDataUrl(blob)
    const { width, height } = await readImageDimensions(dataUrl)

    if (width <= 0 || height <= 0) return null

    return { dataUrl, format, width, height }
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
