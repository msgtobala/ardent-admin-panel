import type {
  ClinicalVignettePreviousSortField,
  ResolvedClinicalVignetteQuestion,
} from '@/types/clinical-vignette'
import type { SortDirection } from '@/types/table'

function compareStrings(
  left: string,
  right: string,
  sortDirection: SortDirection,
): number {
  const result = left.localeCompare(right, undefined, { sensitivity: 'base' })
  return sortDirection === 'asc' ? result : -result
}

function compareDates(left: Date, right: Date, sortDirection: SortDirection): number {
  const result = left.getTime() - right.getTime()
  return sortDirection === 'asc' ? result : -result
}

export function sortClinicalVignettePreviousQuestions(
  questions: ResolvedClinicalVignetteQuestion[],
  sortField: ClinicalVignettePreviousSortField,
  sortDirection: SortDirection,
): ResolvedClinicalVignetteQuestion[] {
  const sorted = [...questions]

  sorted.sort((left, right) => {
    switch (sortField) {
      case 'subjectName':
        return compareStrings(left.subjectName, right.subjectName, sortDirection)
      case 'questionText':
        return compareStrings(left.questionText, right.questionText, sortDirection)
      case 'createdAt':
        return compareDates(left.createdAt, right.createdAt, sortDirection)
      default:
        return 0
    }
  })

  return sorted
}
