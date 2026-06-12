import type { DocumentData } from 'firebase/firestore'

import { mapQbankQuestionReference } from '@/lib/qbank-references'
import type { QbankQuestionReference } from '@/types/qbank-question'

export const EMPTY_QBANK_QUESTION_REFERENCE: QbankQuestionReference = {
  bookName: '',
  pageNo: '',
  chapter: '',
}

export function serializeGrandTestReferences(
  reference: QbankQuestionReference,
): Array<Record<string, string>> | undefined {
  const payload: Record<string, string> = {}

  if (reference.bookName.trim()) payload.bookName = reference.bookName.trim()
  if (reference.pageNo.trim()) payload.pageNo = reference.pageNo.trim()
  if (reference.chapter.trim()) payload.chapter = reference.chapter.trim()

  return Object.keys(payload).length > 0 ? [payload] : undefined
}

function mapReferenceRecord(referenceRecord: Record<string, unknown>): QbankQuestionReference {
  const readField = (field: 'bookName' | 'pageNo' | 'chapter'): string => {
    const value = referenceRecord[field]
    return typeof value === 'string' ? value.trim() : ''
  }

  return {
    bookName: readField('bookName'),
    pageNo: readField('pageNo'),
    chapter: readField('chapter'),
  }
}

export function parseGrandTestReferencesFromDoc(
  data: Record<string, unknown>,
): QbankQuestionReference {
  const references = data.references
  if (Array.isArray(references) && references.length > 0) {
    const firstReference = references[0]
    if (firstReference && typeof firstReference === 'object') {
      return mapReferenceRecord(firstReference as Record<string, unknown>)
    }
  }

  return { ...EMPTY_QBANK_QUESTION_REFERENCE }
}

export function extractReferencesFromQbankDoc(
  data: DocumentData,
): Array<Record<string, string>> | undefined {
  return serializeGrandTestReferences(mapQbankQuestionReference(data))
}

export function formatGrandTestReferenceSummary(
  reference: QbankQuestionReference,
): string | null {
  const parts: string[] = []

  if (reference.bookName.trim()) parts.push(reference.bookName.trim())
  if (reference.pageNo.trim()) parts.push(`p. ${reference.pageNo.trim()}`)
  if (reference.chapter.trim()) parts.push(reference.chapter.trim())

  return parts.length > 0 ? parts.join(' · ') : null
}
