import {
  updateVideoLessonThumbnailImage,
} from '@/lib/video-lessons'
import { MUX_ASSET_STATUS, type VideoLesson } from '@/types/video-lesson'

export function buildMuxThumbnailImageUrl(muxPlaybackId: string): string {
  const trimmedId = muxPlaybackId.trim()
  if (!trimmedId) return ''

  return `https://image.mux.com/${trimmedId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`
}

export function lessonHasMuxVideo(lesson: VideoLesson): boolean {
  return (
    lesson.muxAssetStatus === MUX_ASSET_STATUS.ready &&
    Boolean(lesson.muxPlaybackId.trim())
  )
}

export function lessonHasThumbnail(lesson: VideoLesson): boolean {
  return Boolean(lesson.thumbnailImage.trim())
}

export async function generateVideoLessonThumbnailFromMux(
  subjectId: string,
  lesson: VideoLesson,
): Promise<string> {
  const playbackId = lesson.muxPlaybackId.trim()
  if (!playbackId) {
    throw new Error('This lesson does not have a linked Mux video yet.')
  }

  const thumbnailImage = buildMuxThumbnailImageUrl(playbackId)
  await updateVideoLessonThumbnailImage(subjectId, lesson.id, thumbnailImage)
  return thumbnailImage
}
