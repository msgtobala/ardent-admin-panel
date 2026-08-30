export function getConfiguredStorageBucket(): string {
  return import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? ''
}

function projectIdFromStorageBucket(bucket: string): string | null {
  const trimmed = bucket.trim()
  if (!trimmed) return null

  if (trimmed.endsWith('.appspot.com')) {
    return trimmed.slice(0, -'.appspot.com'.length)
  }

  if (trimmed.endsWith('.firebasestorage.app')) {
    return trimmed.slice(0, -'.firebasestorage.app'.length)
  }

  return null
}

export function storageBucketsMatch(
  urlBucket: string,
  configuredBucket: string,
): boolean {
  const normalizedUrlBucket = urlBucket.trim()
  const normalizedConfiguredBucket = configuredBucket.trim()

  if (!normalizedUrlBucket || !normalizedConfiguredBucket) return false
  if (normalizedUrlBucket === normalizedConfiguredBucket) return true

  const urlProjectId = projectIdFromStorageBucket(normalizedUrlBucket)
  const configuredProjectId = projectIdFromStorageBucket(normalizedConfiguredBucket)

  return (
    urlProjectId !== null &&
    configuredProjectId !== null &&
    urlProjectId === configuredProjectId
  )
}

export function parseFirebaseStoragePathFromUrl(url: string): string | null {
  const configuredBucket = getConfiguredStorageBucket()
  const trimmedUrl = url.trim()
  if (!configuredBucket || !trimmedUrl) return null

  try {
    const parsed = new URL(trimmedUrl)

    if (parsed.hostname === 'storage.googleapis.com') {
      const pathSegments = parsed.pathname.split('/').filter(Boolean)
      if (pathSegments.length < 2) return null
      if (!storageBucketsMatch(pathSegments[0] ?? '', configuredBucket)) return null

      return decodeURIComponent(pathSegments.slice(1).join('/'))
    }

    if (
      parsed.hostname === 'firebasestorage.googleapis.com' ||
      parsed.hostname.endsWith('.firebasestorage.app')
    ) {
      const match = parsed.pathname.match(/\/b\/([^/]+)\/o\/(.+)$/)
      if (!match) return null

      const urlBucket = decodeURIComponent(match[1] ?? '')
      if (!storageBucketsMatch(urlBucket, configuredBucket)) return null

      return decodeURIComponent(match[2] ?? '')
    }

    return null
  } catch {
    return null
  }
}
