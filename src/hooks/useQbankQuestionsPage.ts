import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { fetchQbankChapters } from '@/lib/qbank-chapters'
import {
  fetchQbankQuestionsPage,
  getQbankQuestionsCount,
} from '@/lib/qbank-references'
import { fetchQbankSubjects } from '@/lib/qbank-subjects'
import type { QbankChapter } from '@/types/qbank-chapter'
import type { QbankQuestionListItem } from '@/types/qbank-question-list-item'
import type { QbankSubject } from '@/types/qbank-subject'

export const QBANK_QUESTIONS_PAGE_SIZE = 10

function resetQuestionPaginationState(
  setQuestions: (value: QbankQuestionListItem[]) => void,
  setPageIndex: (value: number) => void,
  setPageCursors: (value: (QueryDocumentSnapshot<DocumentData> | null)[]) => void,
  setHasNext: (value: boolean) => void,
  setLastDocOnPage: (value: QueryDocumentSnapshot<DocumentData> | null) => void,
  setTotalCount: (value: number) => void,
) {
  setQuestions([])
  setPageIndex(0)
  setPageCursors([null])
  setHasNext(false)
  setLastDocOnPage(null)
  setTotalCount(0)
}

export function useQbankQuestionsPage(refreshKey = 0) {
  const [subjects, setSubjects] = useState<QbankSubject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState('')

  const [chapters, setChapters] = useState<QbankChapter[]>([])
  const [questions, setQuestions] = useState<QbankQuestionListItem[]>([])

  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  const [subjectsError, setSubjectsError] = useState<string | undefined>()
  const [chaptersError, setChaptersError] = useState<string | undefined>()
  const [questionsError, setQuestionsError] = useState<string | undefined>()
  const [questionsIndexUrl, setQuestionsIndexUrl] = useState<string | undefined>()

  const [pageIndex, setPageIndex] = useState(0)
  const [pageCursors, setPageCursors] = useState<
    (QueryDocumentSnapshot<DocumentData> | null)[]
  >([null])
  const [hasNext, setHasNext] = useState(false)
  const [lastDocOnPage, setLastDocOnPage] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  )

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId],
  )

  const hasPrevious = pageIndex > 0
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / QBANK_QUESTIONS_PAGE_SIZE)
  const currentPage = pageIndex + 1

  const loadSubjects = useCallback(async () => {
    setIsLoadingSubjects(true)
    setSubjectsError(undefined)

    try {
      const nextSubjects = await fetchQbankSubjects()
      setSubjects(nextSubjects)

      setSelectedSubjectId((prev) => {
        if (prev && nextSubjects.some((subject) => subject.id === prev)) return prev
        return nextSubjects[0]?.id ?? ''
      })
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setSubjectsError(details.message)
      setSelectedSubjectId('')
      setSubjects([])
    } finally {
      setIsLoadingSubjects(false)
    }
  }, [])

  const loadChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) {
      setChapters([])
      setChaptersError(undefined)
      return
    }

    setIsLoadingChapters(true)
    setChaptersError(undefined)

    try {
      const nextChapters = await fetchQbankChapters(subjectId)
      setChapters(nextChapters)

      setSelectedChapterId((prev) => {
        if (prev && nextChapters.some((chapter) => chapter.id === prev)) return prev
        return nextChapters[0]?.id ?? ''
      })
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setChaptersError(details.message)
      setChapters([])
      setSelectedChapterId('')
    } finally {
      setIsLoadingChapters(false)
    }
  }, [])

  const loadPage = useCallback(
    async (cursor: QueryDocumentSnapshot<DocumentData> | null) => {
      if (!selectedSubjectId || !selectedChapterId) {
        resetQuestionPaginationState(
          setQuestions,
          setPageIndex,
          setPageCursors,
          setHasNext,
          setLastDocOnPage,
          setTotalCount,
        )
        setQuestionsError(undefined)
        setQuestionsIndexUrl(undefined)
        return
      }

      setIsLoadingQuestions(true)
      setQuestionsError(undefined)
      setQuestionsIndexUrl(undefined)

      const chapterName =
        chapters.find((chapter) => chapter.id === selectedChapterId)?.chapterName ??
        selectedChapterId

      try {
        const shouldFetchCount = cursor === null
        const [pageResult, count] = await Promise.all([
          fetchQbankQuestionsPage({
            subjectId: selectedSubjectId,
            chapterId: selectedChapterId,
            pageSize: QBANK_QUESTIONS_PAGE_SIZE,
            lastDoc: cursor,
          }),
          shouldFetchCount
            ? getQbankQuestionsCount(selectedSubjectId, selectedChapterId)
            : Promise.resolve(undefined),
        ])

        setQuestions(
          pageResult.questions.map((question) => ({
            ...question,
            chapterId: selectedChapterId,
            chapterName,
          })),
        )
        if (count !== undefined) setTotalCount(count)
        setHasNext(pageResult.hasMore)
        setLastDocOnPage(pageResult.lastDoc)
      } catch (loadError) {
        const details = getFirestoreErrorDetails(loadError)
        setQuestionsError(details.message)
        setQuestionsIndexUrl(details.indexUrl)
        setQuestions([])
        setHasNext(false)
        setLastDocOnPage(null)
      } finally {
        setIsLoadingQuestions(false)
      }
    },
    [chapters, selectedChapterId, selectedSubjectId],
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadSubjects()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadSubjects, refreshKey])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadChapters(selectedSubjectId)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadChapters, selectedSubjectId, refreshKey])

  useEffect(() => {
    setPageIndex(0)
    setPageCursors([null])
  }, [selectedSubjectId, selectedChapterId, refreshKey])

  useEffect(() => {
    if (!selectedSubjectId || !selectedChapterId) return

    const timeoutId = setTimeout(() => {
      void loadPage(pageCursors[pageIndex] ?? null)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadPage, pageCursors, pageIndex, selectedChapterId, selectedSubjectId])

  const handleSubjectChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setSelectedChapterId('')
    resetQuestionPaginationState(
      setQuestions,
      setPageIndex,
      setPageCursors,
      setHasNext,
      setLastDocOnPage,
      setTotalCount,
    )
  }, [])

  const handleChapterChange = useCallback((chapterId: string) => {
    setSelectedChapterId(chapterId)
    resetQuestionPaginationState(
      setQuestions,
      setPageIndex,
      setPageCursors,
      setHasNext,
      setLastDocOnPage,
      setTotalCount,
    )
  }, [])

  const handleRetrySubjects = useCallback(() => {
    void loadSubjects()
  }, [loadSubjects])

  const handleRetryChapters = useCallback(() => {
    if (!selectedSubjectId) return
    void loadChapters(selectedSubjectId)
  }, [loadChapters, selectedSubjectId])

  const handleRetryQuestions = useCallback(() => {
    if (!selectedSubjectId || !selectedChapterId) return
    void loadPage(pageCursors[pageIndex] ?? null)
  }, [loadPage, pageCursors, pageIndex, selectedChapterId, selectedSubjectId])

  const handleNext = useCallback(() => {
    if (!hasNext || isLoadingQuestions || !lastDocOnPage) return

    setPageCursors((prev) => {
      const next = [...prev]
      next[pageIndex + 1] = lastDocOnPage
      return next
    })
    setPageIndex((prev) => prev + 1)
  }, [hasNext, isLoadingQuestions, lastDocOnPage, pageIndex])

  const handlePrevious = useCallback(() => {
    if (!hasPrevious || isLoadingQuestions) return
    setPageIndex((prev) => prev - 1)
  }, [hasPrevious, isLoadingQuestions])

  const isSubjectsInitialLoading =
    isLoadingSubjects && subjects.length === 0 && !subjectsError
  const isChaptersInitialLoading =
    Boolean(selectedSubjectId) &&
    isLoadingChapters &&
    chapters.length === 0 &&
    !chaptersError
  const isQuestionsInitialLoading =
    Boolean(selectedChapterId) &&
    isLoadingQuestions &&
    questions.length === 0 &&
    !questionsError
  const isQuestionsPageLoading =
    Boolean(selectedChapterId) &&
    isLoadingQuestions &&
    questions.length > 0 &&
    !questionsError

  return {
    subjects,
    selectedSubjectId,
    selectedSubject,
    selectedChapterId,
    selectedChapter,
    chapters,
    questions,
    totalQuestionCount: totalCount,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    isLoadingSubjects,
    isLoadingChapters,
    isLoadingQuestions,
    isSubjectsInitialLoading,
    isChaptersInitialLoading,
    isQuestionsInitialLoading,
    isQuestionsPageLoading,
    subjectsError,
    chaptersError,
    questionsError,
    questionsIndexUrl,
    handleSubjectChange,
    handleChapterChange,
    handleRetrySubjects,
    handleRetryChapters,
    handleRetryQuestions,
    handleNext,
    handlePrevious,
  }
}
