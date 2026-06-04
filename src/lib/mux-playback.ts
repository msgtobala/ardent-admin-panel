import { auth } from './firebase'

const DEFAULT_MUX_PLAYBACK_URL =
  'https://asia-south1-ardent-mds.cloudfunctions.net/getMuxPlaybackUrl'

const muxPlaybackUrl =
  import.meta.env.VITE_MUX_PLAYBACK_URL?.trim() || DEFAULT_MUX_PLAYBACK_URL

/** Refresh slightly before expiry to avoid using a URL the CDN may reject. */
const CACHE_REFRESH_BUFFER_MS = 60_000

const DEFAULT_CACHE_TTL_MS =
  (Number(import.meta.env.VITE_MUX_PLAYBACK_CACHE_TTL_SEC) || 3600) * 1000

interface MuxPlaybackUrlFields {
  url?: string
  playbackUrl?: string
  streamUrl?: string
  hlsUrl?: string
  signedUrl?: string
}

interface MuxPlaybackExpiryFields {
  expiresAt?: string | number
  expiresIn?: number
  ttl?: number
  ttlSeconds?: number
}

interface MuxPlaybackResponse extends MuxPlaybackUrlFields {
  result?: string | (MuxPlaybackUrlFields & MuxPlaybackExpiryFields)
  data?: MuxPlaybackUrlFields & MuxPlaybackExpiryFields
  error?: {
    message?: string
    status?: string
  }
}

export interface FetchMuxPlaybackUrlInput {
  subjectId: string
  lessonId: string
}

interface MuxPlaybackCacheEntry {
  url: string
  expiresAt: number
}

const playbackUrlCache = new Map<string, MuxPlaybackCacheEntry>()
const inFlightRequests = new Map<string, Promise<string>>()

function buildCacheKey(subjectId: string, lessonId: string): string {
  return `${subjectId}:${lessonId}`
}

function isCacheEntryValid(entry: MuxPlaybackCacheEntry): boolean {
  return Date.now() < entry.expiresAt - CACHE_REFRESH_BUFFER_MS
}

function parseJwtExpiryMs(token: string): number | undefined {
  const parts = token.split('.')
  if (parts.length < 2) return undefined

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { exp?: number }
    if (typeof payload.exp === 'number' && payload.exp > 0) {
      return payload.exp * 1000
    }
  } catch {
    return undefined
  }

  return undefined
}

function parseExpiryFromPlaybackUrl(url: string): number | undefined {
  try {
    const parsed = new URL(url)
    const tokenParam =
      parsed.searchParams.get('token') ??
      parsed.searchParams.get('jwt') ??
      parsed.searchParams.get('playback_token')

    if (tokenParam) {
      const fromJwt = parseJwtExpiryMs(tokenParam)
      if (fromJwt) return fromJwt
    }

    const expParam = parsed.searchParams.get('exp')
    if (expParam) {
      const expSeconds = Number(expParam)
      if (Number.isFinite(expSeconds) && expSeconds > 0) {
        return expSeconds < 1e12 ? expSeconds * 1000 : expSeconds
      }
    }
  } catch {
    return undefined
  }

  return undefined
}

function parseExpiresAtValue(value: string | number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value < 1e12 ? value * 1000 : value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined

    const asNumber = Number(trimmed)
    if (Number.isFinite(asNumber) && asNumber > 0) {
      return asNumber < 1e12 ? asNumber * 1000 : asNumber
    }

    const asDate = Date.parse(trimmed)
    if (Number.isFinite(asDate) && asDate > 0) {
      return asDate
    }
  }

  return undefined
}

function extractExpiryFields(
  fields: (MuxPlaybackUrlFields & MuxPlaybackExpiryFields) | undefined,
): MuxPlaybackExpiryFields | undefined {
  if (!fields || typeof fields !== 'object') return undefined
  return fields
}

function extractExpiryFromPayload(payload: unknown): MuxPlaybackExpiryFields | undefined {
  if (!payload || typeof payload !== 'object') return undefined

  const response = payload as MuxPlaybackResponse & MuxPlaybackExpiryFields

  if (response.result && typeof response.result === 'object') {
    const fromResult = extractExpiryFields(response.result)
    if (fromResult) return fromResult
  }

  const fromData = extractExpiryFields(response.data)
  if (fromData) return fromData

  return {
    expiresAt: response.expiresAt,
    expiresIn: response.expiresIn,
    ttl: response.ttl,
    ttlSeconds: response.ttlSeconds,
  }
}

function resolveExpiresAt(payload: unknown, playbackUrl: string): number {
  const fromUrl = parseExpiryFromPlaybackUrl(playbackUrl)
  if (fromUrl) return fromUrl

  const expiryFields = extractExpiryFromPayload(payload)
  if (expiryFields) {
    const fromExpiresAt = expiryFields.expiresAt
      ? parseExpiresAtValue(expiryFields.expiresAt)
      : undefined
    if (fromExpiresAt) return fromExpiresAt

    const ttlSeconds = expiryFields.ttlSeconds ?? expiryFields.ttl ?? expiryFields.expiresIn
    if (typeof ttlSeconds === 'number' && Number.isFinite(ttlSeconds) && ttlSeconds > 0) {
      return Date.now() + ttlSeconds * 1000
    }
  }

  return Date.now() + DEFAULT_CACHE_TTL_MS
}

function extractUrlFromFields(fields: MuxPlaybackUrlFields | undefined): string | undefined {
  if (!fields) return undefined

  const candidates = [
    fields.url,
    fields.playbackUrl,
    fields.streamUrl,
    fields.hlsUrl,
    fields.signedUrl,
  ]

  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0)
}

function extractPlaybackUrl(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined

  const response = payload as MuxPlaybackResponse

  if (typeof response.result === 'string' && response.result.trim()) {
    return response.result.trim()
  }

  if (response.result && typeof response.result === 'object') {
    const fromResult = extractUrlFromFields(response.result)
    if (fromResult) return fromResult
  }

  const fromData = extractUrlFromFields(response.data)
  if (fromData) return fromData

  return extractUrlFromFields(response)
}

const LESSON_NOT_FOUND_MESSAGE =
  'Lesson not found. If this lesson is inactive, turn on Active in Edit Lesson to preview the video.'

function normalizePlaybackErrorMessage(message: string): string {
  const trimmed = message.trim()
  if (trimmed.toLowerCase() === 'lesson not found.') {
    return LESSON_NOT_FOUND_MESSAGE
  }
  return trimmed
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const response = payload as MuxPlaybackResponse & { message?: string }
    const callableError = response.error

    if (callableError && typeof callableError === 'object' && callableError.message?.trim()) {
      return normalizePlaybackErrorMessage(callableError.message)
    }

    if (response.message?.trim()) {
      return normalizePlaybackErrorMessage(response.message)
    }
  }

  return `Failed to load video playback (${status}).`
}

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('You must be signed in to preview videos.')
  }

  return user.getIdToken()
}

function setCachedPlaybackUrl(
  subjectId: string,
  lessonId: string,
  url: string,
  payload: unknown,
): void {
  const key = buildCacheKey(subjectId, lessonId)
  playbackUrlCache.set(key, {
    url,
    expiresAt: resolveExpiresAt(payload, url),
  })
}

export function clearMuxPlaybackCache(subjectId: string, lessonId: string): void {
  const trimmedSubjectId = subjectId.trim()
  const trimmedLessonId = lessonId.trim()
  if (!trimmedSubjectId || !trimmedLessonId) return

  playbackUrlCache.delete(buildCacheKey(trimmedSubjectId, trimmedLessonId))
}

export function getCachedMuxPlaybackUrl({
  subjectId,
  lessonId,
}: FetchMuxPlaybackUrlInput): string | undefined {
  const trimmedSubjectId = subjectId.trim()
  const trimmedLessonId = lessonId.trim()
  if (!trimmedSubjectId || !trimmedLessonId) return undefined

  const entry = playbackUrlCache.get(buildCacheKey(trimmedSubjectId, trimmedLessonId))
  if (!entry || !isCacheEntryValid(entry)) {
    if (entry) {
      playbackUrlCache.delete(buildCacheKey(trimmedSubjectId, trimmedLessonId))
    }
    return undefined
  }

  return entry.url
}

async function fetchMuxPlaybackUrlFromNetwork({
  subjectId,
  lessonId,
}: FetchMuxPlaybackUrlInput): Promise<string> {
  const trimmedSubjectId = subjectId.trim()
  const trimmedLessonId = lessonId.trim()

  if (!trimmedSubjectId || !trimmedLessonId) {
    throw new Error('Subject and lesson are required to preview this video.')
  }

  const token = await getAuthToken()

  const response = await fetch(muxPlaybackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        subjectId: trimmedSubjectId,
        lessonId: trimmedLessonId,
      },
    }),
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status))
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    (payload as MuxPlaybackResponse).error
  ) {
    throw new Error(extractErrorMessage(payload, response.status))
  }

  const url = extractPlaybackUrl(payload)
  if (!url) {
    throw new Error('Playback URL was not returned by the server.')
  }

  setCachedPlaybackUrl(trimmedSubjectId, trimmedLessonId, url, payload)
  return url
}

export async function fetchMuxPlaybackUrl(
  input: FetchMuxPlaybackUrlInput,
): Promise<string> {
  const trimmedSubjectId = input.subjectId.trim()
  const trimmedLessonId = input.lessonId.trim()

  if (!trimmedSubjectId || !trimmedLessonId) {
    throw new Error('Subject and lesson are required to preview this video.')
  }

  const cachedUrl = getCachedMuxPlaybackUrl({
    subjectId: trimmedSubjectId,
    lessonId: trimmedLessonId,
  })
  if (cachedUrl) return cachedUrl

  const cacheKey = buildCacheKey(trimmedSubjectId, trimmedLessonId)
  const inFlight = inFlightRequests.get(cacheKey)
  if (inFlight) return inFlight

  const request = fetchMuxPlaybackUrlFromNetwork({
    subjectId: trimmedSubjectId,
    lessonId: trimmedLessonId,
  })
    .catch((error) => {
      playbackUrlCache.delete(cacheKey)
      throw error
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey)
    })

  inFlightRequests.set(cacheKey, request)
  return request
}
