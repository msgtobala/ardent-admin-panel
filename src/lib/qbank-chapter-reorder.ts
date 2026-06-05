import type { QbankChapter } from '@/types/qbank-chapter'

export function moveQbankChapterInList(
  chapters: QbankChapter[],
  index: number,
  direction: 'up' | 'down',
): QbankChapter[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= chapters.length) return chapters

  const nextChapters = [...chapters]
  const [movedChapter] = nextChapters.splice(index, 1)
  nextChapters.splice(targetIndex, 0, movedChapter)
  return nextChapters
}

export function buildQbankChapterSortOrderUpdates(
  chapters: QbankChapter[],
): { id: string; sortOrder: number }[] {
  return chapters.map((chapter, index) => ({
    id: chapter.id,
    sortOrder: index,
  }))
}
