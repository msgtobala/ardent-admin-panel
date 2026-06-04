import type { VideoLesson } from '@/types/video-lesson'

export function moveVideoLessonInList(
  lessons: VideoLesson[],
  index: number,
  direction: 'up' | 'down',
): VideoLesson[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= lessons.length) return lessons

  const nextLessons = [...lessons]
  const [movedLesson] = nextLessons.splice(index, 1)
  nextLessons.splice(targetIndex, 0, movedLesson)
  return nextLessons
}

export function buildVideoLessonSortOrderUpdates(
  lessons: VideoLesson[],
): { id: string; sortOrder: number }[] {
  return lessons.map((lesson, index) => ({
    id: lesson.id,
    sortOrder: index,
  }))
}
