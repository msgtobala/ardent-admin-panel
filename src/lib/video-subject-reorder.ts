import type { VideoSubject } from '@/types/video-subject'

export function moveVideoSubjectInList(
  subjects: VideoSubject[],
  index: number,
  direction: 'up' | 'down',
): VideoSubject[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= subjects.length) return subjects

  const nextSubjects = [...subjects]
  const [movedSubject] = nextSubjects.splice(index, 1)
  nextSubjects.splice(targetIndex, 0, movedSubject)
  return nextSubjects
}

export function buildVideoSubjectSortOrderUpdates(
  subjects: VideoSubject[],
): { id: string; sortOrder: number }[] {
  return subjects.map((subject, index) => ({
    id: subject.id,
    sortOrder: index,
  }))
}
