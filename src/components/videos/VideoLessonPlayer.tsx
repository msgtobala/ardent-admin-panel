import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMuxPlaybackUrl, getCachedMuxPlaybackUrl } from '@/lib/mux-playback'
import { Button } from '@/components/ui/Button'
import { CircularLoader } from '@/components/ui/CircularLoader'

interface VideoLessonPlayerProps {
  subjectId: string
  lessonId: string
  lessonLabel: string
  isLessonActive?: boolean
  autoLoad?: boolean
  compact?: boolean
}

function readCachedPlayback(subjectId: string, lessonId: string) {
  const url = getCachedMuxPlaybackUrl({ subjectId, lessonId })
  if (!url) {
    return {
      playbackUrl: undefined as string | undefined,
      hasLoaded: false,
    }
  }

  return {
    playbackUrl: url,
    hasLoaded: true,
  }
}

const INACTIVE_LESSON_PREVIEW_MESSAGE =
  'This lesson is inactive. Turn on Active in Edit Lesson to preview the video.'

function resolvePlaybackErrorMessage(
  loadError: unknown,
  isLessonActive: boolean,
): string {
  const message =
    loadError instanceof Error
      ? loadError.message
      : 'Failed to load video. Please try again.'

  if (
    !isLessonActive &&
    message.toLowerCase().includes('lesson not found')
  ) {
    return INACTIVE_LESSON_PREVIEW_MESSAGE
  }

  return message
}

export function VideoLessonPlayer({
  subjectId,
  lessonId,
  lessonLabel,
  isLessonActive = true,
  autoLoad = false,
  compact = false,
}: VideoLessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const initialCache = readCachedPlayback(subjectId, lessonId)
  const [playbackUrl, setPlaybackUrl] = useState<string | undefined>(initialCache.playbackUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [hasLoaded, setHasLoaded] = useState(initialCache.hasLoaded)

  const canLoad = Boolean(subjectId.trim() && lessonId.trim())

  const handleLoadVideo = useCallback(async () => {
    if (!canLoad) return

    const cachedUrl = getCachedMuxPlaybackUrl({ subjectId, lessonId })
    if (cachedUrl) {
      setPlaybackUrl(cachedUrl)
      setHasLoaded(true)
      setError(undefined)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      const url = await fetchMuxPlaybackUrl({ subjectId, lessonId })
      setPlaybackUrl(url)
      setHasLoaded(true)
    } catch (loadError) {
      setError(resolvePlaybackErrorMessage(loadError, isLessonActive))
      setPlaybackUrl(undefined)
      setHasLoaded(false)
    } finally {
      setIsLoading(false)
    }
  }, [canLoad, isLessonActive, subjectId, lessonId])

  useEffect(() => {
    const cached = readCachedPlayback(subjectId, lessonId)
    if (cached.hasLoaded && cached.playbackUrl) {
      setPlaybackUrl(cached.playbackUrl)
      setHasLoaded(true)
      setError(undefined)
      setIsLoading(false)
      return
    }

    setPlaybackUrl(undefined)
    setError(undefined)
    setHasLoaded(false)
    setIsLoading(false)
  }, [subjectId, lessonId])

  useEffect(() => {
    if (!autoLoad || !canLoad) return
    if (getCachedMuxPlaybackUrl({ subjectId, lessonId })) return
    handleLoadVideo()
  }, [autoLoad, canLoad, subjectId, lessonId, handleLoadVideo])

  useEffect(() => {
    if (!playbackUrl || !videoRef.current) return
    videoRef.current.load()
  }, [playbackUrl])

  const isHlsStream = playbackUrl?.includes('.m3u8')
  const isPreparingPlayback = autoLoad && canLoad && !hasLoaded && !error && !isLoading
  const showPlaybackStage = isLoading || isPreparingPlayback || Boolean(error) || (hasLoaded && playbackUrl)
  const playbackStageClasses =
    'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-input border border-border-subtle bg-black'

  if (compact) {
    return (
      <div className="flex w-full max-w-[280px] flex-col gap-2" aria-label={`Video for ${lessonLabel}`}>
        {isLoading ? (
          <div
            className="flex aspect-video items-center justify-center rounded-input border border-border-subtle bg-surface-container-low"
            aria-busy="true"
            aria-live="polite"
          >
            <CircularLoader size="sm" label="Loading video" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <p className="text-label-sm text-error-red" role="alert">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && hasLoaded && playbackUrl ? (
          <video
            ref={videoRef}
            controls
            playsInline
            className="aspect-video w-full rounded-input border border-border-subtle bg-black"
            aria-label={`Video for ${lessonLabel}`}
          >
            <source src={playbackUrl} type={isHlsStream ? 'application/x-mpegURL' : undefined} />
          </video>
        ) : null}

        {!isLoading && !error && !hasLoaded && !autoLoad ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadVideo}
            disabled={!canLoad}
            className="w-fit"
          >
            Load video
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-input border border-border-subtle bg-surface-container-low p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-label-sm text-on-surface-variant">Video</span>
        {!autoLoad ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadVideo}
            disabled={isLoading || !canLoad}
          >
            {isLoading ? 'Loading...' : 'Load video'}
          </Button>
        ) : null}
      </div>

      {showPlaybackStage ? (
        <div className="flex flex-col gap-2">
          <div
            className={[
              playbackStageClasses,
              isLoading || isPreparingPlayback ? 'bg-surface-container-low' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-busy={isLoading || isPreparingPlayback}
            aria-live="polite"
          >
            {isLoading || isPreparingPlayback ? (
              <CircularLoader size="md" label="Loading video" />
            ) : null}

            {error ? (
              <p className="px-4 text-center text-body-md text-error-red" role="alert">
                {error}
              </p>
            ) : null}

            {!isLoading && !error && hasLoaded && playbackUrl ? (
              <video
                ref={videoRef}
                controls
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
                aria-label={`Video for ${lessonLabel}`}
              >
                <source src={playbackUrl} type={isHlsStream ? 'application/x-mpegURL' : undefined} />
              </video>
            ) : null}
          </div>

          {hasLoaded && playbackUrl && isHlsStream ? (
            <p className="text-label-sm text-on-surface-variant">
              If playback does not start in this browser,{' '}
              <a
                href={playbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                open the stream in a new tab
              </a>
              .
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
