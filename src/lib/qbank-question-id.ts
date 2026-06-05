import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { getFirestoreErrorDetails } from './firestore-error'
import { db } from './firebase'
import { QBANKS_COLLECTION } from './qbank-subjects'

const SUBJECT_CODES: Record<string, string> = {
  '1': 'PHY',
  '2': 'BIO',
  '3': 'MIC',
  '4': 'PHA',
  '5': 'GM',
  '6': 'END',
  '7': 'PER',
  '8': 'ANA',
  '9': 'OA',
  '10': 'PED',
  '11': 'OH',
  '12': 'GS',
  '13': 'DM',
  '14': 'OP',
  '15': 'OR',
  '16': 'OD',
  '17': 'CD',
  '18': 'OMS',
  '19': 'GP',
  '20': 'ORT',
  '21': 'PRO',
  '22': 'DAH',
  '23': 'RPQ',
  '25': 'IB',
  '26': 'COV',
}

const MCQ_QUESTION_ID_PATTERN = /^MCQ-([A-Z]+)-([A-Z0-9]+)-(\d{3})$/

export interface ParsedMcqQuestionId {
  subjectCode: string
  chapterCode: string
  number: number
}

export interface QbankQuestionIdentity {
  questionId: string
  subjectCode: string
  chapterCode: string
  sortOrder: number
}

export function generateAbbreviation(name: string, maxLength = 4): string {
  const words = name.trim().split(/\s+/)
  let code = words
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, maxLength)

  if (code.length < 2 && words.length > 0) {
    code = words[0].slice(0, 2).toUpperCase()
  }

  return code || 'XX'
}

export function resolveSubjectCode(
  mcqMid: number | null | undefined,
  subjectName: string,
): string {
  if (mcqMid !== null && mcqMid !== undefined) {
    const mapped = SUBJECT_CODES[String(mcqMid)]
    if (mapped) return mapped
  }

  return generateAbbreviation(subjectName, 3)
}

export function formatQuestionId(
  subjectCode: string,
  chapterCode: string,
  questionNumber: number,
): string {
  const paddedNum = String(questionNumber).padStart(3, '0')
  return `MCQ-${subjectCode}-${chapterCode}-${paddedNum}`
}

export function parseMcqQuestionId(id: string): ParsedMcqQuestionId | null {
  const match = id.trim().match(MCQ_QUESTION_ID_PATTERN)
  if (!match) return null

  const number = Number.parseInt(match[3], 10)
  if (!Number.isFinite(number)) return null

  return {
    subjectCode: match[1],
    chapterCode: match[2],
    number,
  }
}

function qbankQuestionsRef(subjectId: string, chapterId: string) {
  return collection(
    db,
    QBANKS_COLLECTION,
    subjectId,
    'chapters',
    chapterId,
    'questions',
  )
}

function resolveMaxSortOrder(data: Record<string, unknown>): number | null {
  if (typeof data.sortOrder === 'number' && Number.isFinite(data.sortOrder)) {
    return data.sortOrder
  }

  if (typeof data.order === 'number' && Number.isFinite(data.order)) {
    return data.order
  }

  return null
}

async function fetchHighestMcqQuestionId(
  subjectId: string,
  chapterId: string,
  subjectCode: string,
): Promise<{ documentId: string; parsed: ParsedMcqQuestionId } | null> {
  const subjectPrefix = `MCQ-${subjectCode}-`
  const subjectPrefixEnd = `${subjectPrefix}\uf8ff`
  const highestIdQuery = query(
    qbankQuestionsRef(subjectId, chapterId),
    where(documentId(), '>=', subjectPrefix),
    where(documentId(), '<=', subjectPrefixEnd),
    orderBy(documentId(), 'desc'),
    limit(1),
  )

  const snapshot = await getDocs(highestIdQuery)
  if (snapshot.empty) return null

  const highestDoc = snapshot.docs[0]
  const parsed = parseMcqQuestionId(highestDoc.id)
  if (!parsed) return null

  return { documentId: highestDoc.id, parsed }
}

async function fetchNextSortOrder(subjectId: string, chapterId: string): Promise<number> {
  const sortOrderQuery = query(
    qbankQuestionsRef(subjectId, chapterId),
    orderBy('sortOrder', 'desc'),
    limit(1),
  )

  const snapshot = await getDocs(sortOrderQuery)
  if (snapshot.empty) return 0

  const maxSortOrder = resolveMaxSortOrder(snapshot.docs[0].data())
  return (maxSortOrder ?? -1) + 1
}

export async function resolveNextQbankQuestionIdentity(options: {
  subjectId: string
  chapterId: string
  mcqMid: number | null
  subjectName: string
  chapterName: string
}): Promise<QbankQuestionIdentity> {
  const subjectCode = resolveSubjectCode(options.mcqMid, options.subjectName)

  const sortOrder = await fetchNextSortOrder(options.subjectId, options.chapterId)

  let highestMcq: Awaited<ReturnType<typeof fetchHighestMcqQuestionId>> = null
  try {
    highestMcq = await fetchHighestMcqQuestionId(
      options.subjectId,
      options.chapterId,
      subjectCode,
    )
  } catch (error) {
    const details = getFirestoreErrorDetails(error, '')
    if (details.indexUrl) {
      throw error
    }

    console.warn(
      'Highest MCQ question ID query failed; falling back to chapter abbreviation.',
      error,
    )
  }

  if (highestMcq) {
    const nextNumber = highestMcq.parsed.number + 1
    return {
      questionId: formatQuestionId(
        highestMcq.parsed.subjectCode,
        highestMcq.parsed.chapterCode,
        nextNumber,
      ),
      subjectCode: highestMcq.parsed.subjectCode,
      chapterCode: highestMcq.parsed.chapterCode,
      sortOrder,
    }
  }

  const chapterCode = generateAbbreviation(options.chapterName)
  return {
    questionId: formatQuestionId(subjectCode, chapterCode, 1),
    subjectCode,
    chapterCode,
    sortOrder,
  }
}

export async function qbankQuestionDocumentExists(
  subjectId: string,
  chapterId: string,
  documentId: string,
): Promise<boolean> {
  const snapshot = await getDoc(
    doc(db, QBANKS_COLLECTION, subjectId, 'chapters', chapterId, 'questions', documentId),
  )
  return snapshot.exists()
}
