import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { formatCorrectAnswerSummary } from '@/lib/qbank-question-display'
import type { QbankQuestionChapterRecord } from '@/types/qbank-question-list-item'
import type {
  FullQbankQuestionDetails,
  QbankAnswerOption,
  QbankCorrectAnswer,
  QbankQuestionEditPayload,
  QbankQuestionReference,
} from '@/types/qbank-question'
import { isCustomQbankQuestionId } from './qbank-question-id'
import { QBANKS_COLLECTION } from './qbank-subjects'
import { db } from './firebase'

interface QbankQuestionData {
  questionRefId: string
  questionText: string
  documentId: string
}

export interface QbankChapterOption {
  id: string
  chapterName: string
}

export interface QbankQuestionOption {
  questionRefId: string
  documentId: string
  label: string
  questionText: string
}

export interface QbankQuestionLocation {
  subjectRefId: string
  chapterRefId: string
  questionRefId: string
  documentId: string
}

async function fetchQbankChapterPaths(): Promise<
  Array<Pick<QbankQuestionLocation, 'subjectRefId' | 'chapterRefId'>>
> {
  const subjectsSnapshot = await getDocs(collection(db, QBANKS_COLLECTION))
  const chapterPathGroups = await Promise.all(
    subjectsSnapshot.docs.map(async (subjectDoc) => {
      const chaptersSnapshot = await getDocs(
        collection(db, QBANKS_COLLECTION, subjectDoc.id, 'chapters'),
      )

      return chaptersSnapshot.docs.map((chapterDoc) => ({
        subjectRefId: subjectDoc.id,
        chapterRefId: chapterDoc.id,
      }))
    }),
  )

  return chapterPathGroups.flat()
}

function resolveQuestionRefId(
  documentId: string,
  data: DocumentData,
): string {
  return typeof data.questionRefId === 'string' && data.questionRefId.trim()
    ? data.questionRefId.trim()
    : documentId
}

export async function resolveQbankQuestionLocationsByDocumentIds(
  documentIds: string[],
): Promise<Map<string, QbankQuestionLocation>> {
  const uniqueDocumentIds = [...new Set(documentIds)]
  const locations = new Map<string, QbankQuestionLocation>()

  if (uniqueDocumentIds.length === 0) return locations

  const unresolvedDocumentIds = new Set(uniqueDocumentIds)
  const chapterPaths = await fetchQbankChapterPaths()

  for (const chapterPath of chapterPaths) {
    if (unresolvedDocumentIds.size === 0) break

    await Promise.all(
      [...unresolvedDocumentIds].map(async (documentId) => {
        const questionDocument = await fetchQbankQuestionDocument(
          chapterPath.subjectRefId,
          chapterPath.chapterRefId,
          documentId,
        )

        if (!questionDocument) return

        locations.set(documentId, {
          subjectRefId: chapterPath.subjectRefId,
          chapterRefId: chapterPath.chapterRefId,
          questionRefId: resolveQuestionRefId(
            questionDocument.documentId,
            questionDocument.data,
          ),
          documentId: questionDocument.documentId,
        })
        unresolvedDocumentIds.delete(documentId)
      }),
    )
  }

  return locations
}

export async function fetchQbankSubjectName(subjectRefId: string): Promise<string> {
  const snapshot = await getDoc(doc(db, QBANKS_COLLECTION, subjectRefId))
  if (!snapshot.exists()) return '—'

  const data = snapshot.data()
  const name = data.subjectName
  return typeof name === 'string' && name.trim() ? name.trim() : '—'
}

export async function fetchQbankChapterName(
  subjectRefId: string,
  chapterRefId: string,
): Promise<string> {
  const snapshot = await getDoc(
    doc(db, QBANKS_COLLECTION, subjectRefId, 'chapters', chapterRefId),
  )
  if (!snapshot.exists()) return '—'

  const data = snapshot.data()
  const name = data.chapterName
  return typeof name === 'string' && name.trim() ? name.trim() : '—'
}

export async function fetchQbankQuestionDocument(
  subjectRefId: string,
  chapterRefId: string,
  questionRefId: string,
): Promise<{ documentId: string; data: DocumentData } | null> {
  const questionsRef = collection(
    db,
    QBANKS_COLLECTION,
    subjectRefId,
    'chapters',
    chapterRefId,
    'questions',
  )

  const directRef = doc(questionsRef, questionRefId)
  const directSnapshot = await getDoc(directRef)

  if (directSnapshot.exists()) {
    return { documentId: directSnapshot.id, data: directSnapshot.data() }
  }

  const matchedQuery = query(
    questionsRef,
    where('questionRefId', '==', questionRefId),
    limit(1),
  )
  const matchedSnapshot = await getDocs(matchedQuery)

  if (matchedSnapshot.empty) return null

  const matchedDoc = matchedSnapshot.docs[0]
  return { documentId: matchedDoc.id, data: matchedDoc.data() }
}

async function fetchQbankQuestionData(
  subjectRefId: string,
  chapterRefId: string,
  questionRefId: string,
): Promise<QbankQuestionData | null> {
  const questionDocument = await fetchQbankQuestionDocument(
    subjectRefId,
    chapterRefId,
    questionRefId,
  )
  if (!questionDocument) return null

  return mapQuestionData(questionDocument.documentId, questionDocument.data)
}

function mapQuestionData(
  documentId: string,
  data: DocumentData,
): QbankQuestionData {
  const refId =
    typeof data.questionRefId === 'string' && data.questionRefId.trim()
      ? data.questionRefId.trim()
      : documentId
  const questionText =
    typeof data.question === 'string' && data.question.trim()
      ? data.question.trim()
      : '—'

  return {
    documentId,
    questionRefId: refId,
    questionText,
  }
}

function getAnswerOptionLabel(optionRecord: Record<string, unknown>): string {
  const choiceFields = ['choice', 'text', 'optionText', 'answer', 'value', 'description']

  for (const field of choiceFields) {
    const value = optionRecord[field]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

function getAnswerOptionKey(
  optionRecord: Record<string, unknown>,
  index: number,
): string {
  const optionValue = optionRecord.option

  if (typeof optionValue === 'string' && optionValue.trim()) return optionValue.trim()
  if (typeof optionValue === 'number') return String(optionValue)

  const labelValue = optionRecord.label
  if (typeof labelValue === 'string' && labelValue.trim()) return labelValue.trim()

  return String.fromCharCode(65 + index)
}

function mapSingleAnswerOption(
  entry: unknown,
  index: number,
): QbankAnswerOption | null {
  if (typeof entry === 'string' && entry.trim()) {
    return {
      option: String.fromCharCode(65 + index),
      choice: entry.trim(),
      sortOrder: index,
    }
  }

  if (!entry || typeof entry !== 'object') return null

  const optionRecord = entry as Record<string, unknown>
  const choice = getAnswerOptionLabel(optionRecord)
  if (!choice) return null

  const sortOrder =
    typeof optionRecord.sortOrder === 'number'
      ? optionRecord.sortOrder
      : typeof optionRecord.order === 'number'
        ? optionRecord.order
        : index

  return {
    option: getAnswerOptionKey(optionRecord, index),
    choice,
    sortOrder,
  }
}

function mapAnswerOptions(data: DocumentData): QbankAnswerOption[] {
  const rawAnswerOptions = data.answerOptions
  if (!rawAnswerOptions) return []

  if (Array.isArray(rawAnswerOptions)) {
    return rawAnswerOptions
      .map((entry, index) => mapSingleAnswerOption(entry, index))
      .filter((option): option is QbankAnswerOption => option !== null)
      .sort((left, right) => left.sortOrder - right.sortOrder)
  }

  if (typeof rawAnswerOptions === 'object') {
    return Object.entries(rawAnswerOptions as Record<string, unknown>)
      .map(([key, value], index) => {
        if (typeof value === 'string' && value.trim()) {
          return {
            option: key,
            choice: value.trim(),
            sortOrder: index,
          }
        }

        return mapSingleAnswerOption(value, index)
      })
      .filter((option): option is QbankAnswerOption => option !== null)
      .sort((left, right) => left.sortOrder - right.sortOrder)
  }

  return []
}

function mapCorrectAnswer(data: DocumentData): QbankCorrectAnswer | null {
  const correctAnswer = data.correctAnswer
  if (!correctAnswer || typeof correctAnswer !== 'object') return null

  const correctRecord = correctAnswer as Record<string, unknown>
  const rawOption = correctRecord.option
  const option =
    typeof rawOption === 'string' && rawOption.trim()
      ? rawOption.trim()
      : typeof rawOption === 'number'
        ? String(rawOption)
        : ''
  const description =
    typeof correctRecord.description === 'string' && correctRecord.description.trim()
      ? correctRecord.description.trim()
      : ''

  if (!option && !description) return null

  return { option, description }
}

function mapCorrectAnswerImages(data: DocumentData): string[] {
  const correctAnswer = data.correctAnswer
  if (!correctAnswer || typeof correctAnswer !== 'object') return []

  const correctRecord = correctAnswer as Record<string, unknown>
  const rawImages = correctRecord.image
  if (!Array.isArray(rawImages)) return []

  return rawImages
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
}

function mapReferenceStringField(
  referenceRecord: Record<string, unknown>,
  field: string,
): string {
  const value = referenceRecord[field]
  return typeof value === 'string' ? value.trim() : ''
}

export function mapQbankQuestionReference(data: DocumentData): QbankQuestionReference {
  const reference = data.reference
  if (!reference || typeof reference !== 'object') {
    return { bookName: '', pageNo: '', chapter: '' }
  }

  const referenceRecord = reference as Record<string, unknown>
  return {
    bookName: mapReferenceStringField(referenceRecord, 'bookName'),
    pageNo: mapReferenceStringField(referenceRecord, 'pageNo'),
    chapter: mapReferenceStringField(referenceRecord, 'chapter'),
  }
}

function mapReferenceSummary(data: DocumentData): string | null {
  const reference = data.reference
  if (!reference || typeof reference !== 'object') return null

  const referenceRecord = reference as Record<string, unknown>
  const parts: string[] = []

  const bookName =
    typeof referenceRecord.bookName === 'string' && referenceRecord.bookName.trim()
      ? referenceRecord.bookName.trim()
      : ''
  const pageNo =
    typeof referenceRecord.pageNo === 'string' && referenceRecord.pageNo.trim()
      ? referenceRecord.pageNo.trim()
      : ''
  const chapter =
    typeof referenceRecord.chapter === 'string' && referenceRecord.chapter.trim()
      ? referenceRecord.chapter.trim()
      : ''

  if (bookName) parts.push(bookName)
  if (chapter) parts.push(chapter)
  if (pageNo) parts.push(`p. ${pageNo}`)

  return parts.length > 0 ? parts.join(' · ') : null
}

function mapTags(data: DocumentData): string[] {
  if (!Array.isArray(data.tags)) return []

  return data.tags
    .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    .map((tag) => tag.trim())
}

function mapSortOrder(data: DocumentData): number | null {
  if (typeof data.sortOrder === 'number' && Number.isFinite(data.sortOrder)) {
    return data.sortOrder
  }

  if (typeof data.order === 'number' && Number.isFinite(data.order)) {
    return data.order
  }

  return null
}

function mapIsActive(data: DocumentData): boolean {
  return typeof data.isActive === 'boolean' ? data.isActive : true
}

function mapQuestionChapterRecord(
  documentId: string,
  data: DocumentData,
): QbankQuestionChapterRecord {
  const details = mapFullQuestionDetails(documentId, data)

  return {
    documentId: details.documentId,
    questionRefId: details.questionRefId,
    questionText: details.questionText,
    questionImage: details.questionImage,
    difficulty: details.difficulty,
    tags: details.tags,
    answerOptions: details.answerOptions,
    answerOptionsCount: details.answerOptions.length,
    correctAnswer: details.correctAnswer,
    correctAnswerImages: mapCorrectAnswerImages(data),
    correctAnswerSummary: formatCorrectAnswerSummary(
      details.answerOptions,
      details.correctAnswer,
    ),
    referenceSummary: details.referenceSummary,
    isActive: mapIsActive(data),
    sortOrder: mapSortOrder(data),
  }
}

function mapFullQuestionDetails(
  documentId: string,
  data: DocumentData,
): FullQbankQuestionDetails {
  const basic = mapQuestionData(documentId, data)
  const questionImage =
    typeof data.questionImage === 'string' && data.questionImage.trim()
      ? data.questionImage.trim()
      : null
  const difficulty =
    typeof data.difficulty === 'string' && data.difficulty.trim()
      ? data.difficulty.trim()
      : null

  return {
    documentId: basic.documentId,
    questionRefId: basic.questionRefId,
    questionText: basic.questionText,
    questionImage,
    difficulty,
    tags: mapTags(data),
    answerOptions: mapAnswerOptions(data),
    correctAnswer: mapCorrectAnswer(data),
    referenceSummary: mapReferenceSummary(data),
  }
}

function mapQuestionTextForEdit(questionText: string): string {
  return questionText === '—' ? '' : questionText
}

export async function fetchQbankQuestionForEdit(
  subjectRefId: string,
  chapterRefId: string,
  documentId: string,
): Promise<QbankQuestionEditPayload | null> {
  const snapshot = await getDoc(
    doc(db, QBANKS_COLLECTION, subjectRefId, 'chapters', chapterRefId, 'questions', documentId),
  )
  if (!snapshot.exists()) return null

  const data = snapshot.data()
  const details = mapFullQuestionDetails(snapshot.id, data)

  return {
    documentId: details.documentId,
    questionRefId: details.questionRefId,
    questionText: mapQuestionTextForEdit(details.questionText),
    questionImage: details.questionImage,
    difficulty: details.difficulty,
    tags: details.tags,
    answerOptions: details.answerOptions,
    correctAnswer: details.correctAnswer,
    correctAnswerImages: mapCorrectAnswerImages(data),
    reference: mapQbankQuestionReference(data),
    isActive: mapIsActive(data),
    sortOrder: mapSortOrder(data),
  }
}

export async function fetchFullQbankQuestionDetails(
  subjectRefId: string,
  chapterRefId: string,
  questionRefId: string,
): Promise<FullQbankQuestionDetails | null> {
  const questionDocument = await fetchQbankQuestionDocument(
    subjectRefId,
    chapterRefId,
    questionRefId,
  )
  if (!questionDocument) return null

  return mapFullQuestionDetails(questionDocument.documentId, questionDocument.data)
}

export async function resolveQbankQuestionDetails(
  subjectRefId: string,
  chapterRefId: string,
  questionRefId: string,
): Promise<{
  subjectName: string
  chapterName: string
  questionText: string
}> {
  const [subjectName, chapterName, questionData] = await Promise.all([
    fetchQbankSubjectName(subjectRefId),
    fetchQbankChapterName(subjectRefId, chapterRefId),
    fetchQbankQuestionData(subjectRefId, chapterRefId, questionRefId),
  ])

  return {
    subjectName,
    chapterName,
    questionText: questionData?.questionText ?? '—',
  }
}

export async function fetchQbankChapterOptions(
  subjectRefId: string,
): Promise<QbankChapterOption[]> {
  const chaptersRef = collection(db, QBANKS_COLLECTION, subjectRefId, 'chapters')
  const snapshot = await getDocs(chaptersRef)

  return snapshot.docs
    .map((chapterDoc) => {
      const data = chapterDoc.data()
      const chapterName =
        typeof data.chapterName === 'string' && data.chapterName.trim()
          ? data.chapterName.trim()
          : chapterDoc.id

      return {
        id: chapterDoc.id,
        chapterName,
      }
    })
    .sort((left, right) => left.chapterName.localeCompare(right.chapterName))
}

const DEFAULT_QBANK_QUESTIONS_PAGE_SIZE = 10

function qbankQuestionsRef(subjectRefId: string, chapterRefId: string) {
  return collection(
    db,
    QBANKS_COLLECTION,
    subjectRefId,
    'chapters',
    chapterRefId,
    'questions',
  )
}

export interface FetchQbankQuestionsPageResult {
  questions: QbankQuestionChapterRecord[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

export async function fetchQbankQuestionsPage(options: {
  subjectId: string
  chapterId: string
  pageSize?: number
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
}): Promise<FetchQbankQuestionsPageResult> {
  const pageSize = options.pageSize ?? DEFAULT_QBANK_QUESTIONS_PAGE_SIZE
  const questionsRef = qbankQuestionsRef(options.subjectId, options.chapterId)

  const listQuery = options.lastDoc
    ? query(
        questionsRef,
        orderBy('sortOrder', 'asc'),
        orderBy(documentId(), 'asc'),
        startAfter(options.lastDoc),
        limit(pageSize + 1),
      )
    : query(
        questionsRef,
        orderBy('sortOrder', 'asc'),
        orderBy(documentId(), 'asc'),
        limit(pageSize + 1),
      )

  const snapshot = await getDocs(listQuery)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const pageDocs = (hasMore ? docs.slice(0, pageSize) : docs).filter(
    (questionDoc) => !isCustomQbankQuestionId(questionDoc.id),
  )

  return {
    questions: pageDocs.map((questionDoc) =>
      mapQuestionChapterRecord(questionDoc.id, questionDoc.data()),
    ),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  }
}

export async function getQbankQuestionsCount(
  subjectId: string,
  chapterId: string,
): Promise<number> {
  const snapshot = await getCountFromServer(query(qbankQuestionsRef(subjectId, chapterId)))
  return snapshot.data().count
}

export async function fetchQbankQuestionsForChapter(
  subjectRefId: string,
  chapterRefId: string,
): Promise<QbankQuestionChapterRecord[]> {
  const questionsRef = qbankQuestionsRef(subjectRefId, chapterRefId)
  const snapshot = await getDocs(questionsRef)

  return snapshot.docs
    .filter((questionDoc) => !isCustomQbankQuestionId(questionDoc.id))
    .map((questionDoc) => mapQuestionChapterRecord(questionDoc.id, questionDoc.data()))
    .sort((left, right) => {
      const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER
      const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.questionRefId.localeCompare(right.questionRefId)
    })
}

export async function fetchQbankQuestionOptions(
  subjectRefId: string,
  chapterRefId: string,
): Promise<QbankQuestionOption[]> {
  const questionsRef = collection(
    db,
    QBANKS_COLLECTION,
    subjectRefId,
    'chapters',
    chapterRefId,
    'questions',
  )
  const snapshot = await getDocs(questionsRef)

  return snapshot.docs
    .filter((questionDoc) => !isCustomQbankQuestionId(questionDoc.id))
    .map((questionDoc) => {
      const data = questionDoc.data()
      const questionRefId =
        typeof data.questionRefId === 'string' && data.questionRefId.trim()
          ? data.questionRefId.trim()
          : questionDoc.id
      const questionText =
        typeof data.question === 'string' && data.question.trim()
          ? data.question.trim()
          : questionRefId
      const truncated =
        questionText.length > 80 ? `${questionText.slice(0, 80)}…` : questionText

      return {
        documentId: questionDoc.id,
        questionRefId,
        questionText,
        label: `${questionRefId} — ${truncated}`,
      }
    })
    .sort((left, right) => left.questionRefId.localeCompare(right.questionRefId))
}
