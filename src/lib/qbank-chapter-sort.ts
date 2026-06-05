import type { QbankChapter, QbankChapterSortField } from '@/types/qbank-chapter'
import type { SortDirection } from '@/types/table'

function compareNumbers(
  left: number,
  right: number,
  sortDirection: SortDirection,
): number {
  const result = left - right
  return sortDirection === 'asc' ? result : -result
}

function compareStrings(
  left: string,
  right: string,
  sortDirection: SortDirection,
): number {
  const result = left.localeCompare(right, undefined, { sensitivity: 'base' })
  return sortDirection === 'asc' ? result : -result
}

function compareBooleans(
  left: boolean,
  right: boolean,
  sortDirection: SortDirection,
): number {
  const result = Number(left) - Number(right)
  return sortDirection === 'asc' ? result : -result
}

export function sortQbankChapters(
  chapters: QbankChapter[],
  sortField: QbankChapterSortField,
  sortDirection: SortDirection,
): QbankChapter[] {
  const sorted = [...chapters]

  sorted.sort((left, right) => {
    switch (sortField) {
      case 'sortOrder': {
        const sortOrderCompare = compareNumbers(
          left.sortOrder,
          right.sortOrder,
          sortDirection,
        )
        if (sortOrderCompare !== 0) return sortOrderCompare
        return compareStrings(left.chapterName, right.chapterName, 'asc')
      }
      case 'isActive': {
        const activeCompare = compareBooleans(left.isActive, right.isActive, sortDirection)
        if (activeCompare !== 0) return activeCompare

        const sortOrderCompare = compareNumbers(left.sortOrder, right.sortOrder, 'asc')
        if (sortOrderCompare !== 0) return sortOrderCompare

        return compareStrings(left.chapterName, right.chapterName, 'asc')
      }
      default:
        return 0
    }
  })

  return sorted
}
