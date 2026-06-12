import { MUX_ASSET_STATUS, type VideoLesson } from '@/types/video-lesson'

export function lessonHasMuxVideo(lesson: VideoLesson): boolean {
  return (
    lesson.muxAssetStatus === MUX_ASSET_STATUS.ready &&
    Boolean(lesson.muxPlaybackId.trim())
  )
}

export function lessonHasThumbnail(lesson: VideoLesson): boolean {
  return Boolean(lesson.thumbnailImage.trim())
}
