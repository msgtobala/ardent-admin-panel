import { useCallback, useMemo, useState } from 'react'

import { DeleteQbankQuestionModal } from '@/components/qbank-questions/DeleteQbankQuestionModal'
import { QbankQuestionsPageHeader } from '@/components/qbank-questions/QbankQuestionsPageHeader'
import { QbankQuestionsTable } from '@/components/qbank-questions/QbankQuestionsTable'
import { EditQbankQuestionModal } from '@/components/qbank-questions/EditQbankQuestionModal'
import { ViewQbankQuestionModal } from '@/components/qbank-questions/ViewQbankQuestionModal'
import type { QbankQuestionListItem } from '@/types/qbank-question-list-item'
import { deleteQbankQuestionWithAssets } from '@/lib/qbank-questions'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TableErrorState } from '@/components/ui/table'
import { useQbankQuestionsPage } from '@/hooks/useQbankQuestionsPage'

type ModalState =
  | { mode: 'add' }
  | { mode: 'edit'; question: QbankQuestionListItem }
  | { mode: 'delete'; question: QbankQuestionListItem }
  | null

export default function QbankQuestionsPage() {
  const { showSnackbar } = useSnackbar()
  const [selectedQuestion, setSelectedQuestion] = useState<QbankQuestionListItem | null>(null)
  const [modalState, setModalState] = useState<ModalState>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    subjects,
    selectedSubjectId,
    selectedSubject,
    selectedChapterId,
    selectedChapter,
    chapters,
    questions,
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
  } = useQbankQuestionsPage(refreshKey)

  const subjectOptions: SelectOption[] = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject.id,
        label: subject.subjectName.trim() || subject.id,
      })),
    [subjects],
  )

  const chapterOptions: SelectOption[] = useMemo(
    () =>
      chapters.map((chapter) => ({
        value: chapter.id,
        label: chapter.chapterName.trim() || chapter.id,
      })),
    [chapters],
  )

  const hasSubjectSelected = Boolean(selectedSubjectId)
  const hasChapterSelected = Boolean(selectedChapterId)

  const handleQuestionClick = useCallback((question: QbankQuestionListItem) => {
    setSelectedQuestion(question)
  }, [])

  const handleCloseQuestionModal = useCallback(() => {
    setSelectedQuestion(null)
  }, [])

  const handleAddQuestion = useCallback(() => {
    if (!selectedSubjectId || !selectedChapterId) {
      showSnackbar('Select a subject and chapter before adding a question.')
      return
    }

    setModalState({ mode: 'add' })
  }, [selectedChapterId, selectedSubjectId, showSnackbar])

  const handleEditQuestion = useCallback((question: QbankQuestionListItem) => {
    setModalState({ mode: 'edit', question })
  }, [])

  const handleDeleteQuestion = useCallback((question: QbankQuestionListItem) => {
    setModalState({ mode: 'delete', question })
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalState(null)
  }, [])

  const handleQuestionsUpdated = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (modalState?.mode !== 'delete') return

    await deleteQbankQuestionWithAssets(
      selectedSubjectId,
      selectedChapterId,
      modalState.question,
    )
    handleQuestionsUpdated()
  }, [handleQuestionsUpdated, modalState, selectedChapterId, selectedSubjectId])

  const subjectDisplayName =
    selectedSubject?.subjectName.trim() || selectedSubject?.id || ''
  const chapterDisplayName =
    selectedChapter?.chapterName.trim() || selectedChapter?.id || ''

  const isFormModalOpen = modalState?.mode === 'add' || modalState?.mode === 'edit'
  const editingQuestion = modalState?.mode === 'edit' ? modalState.question : null
  const deletingQuestion = modalState?.mode === 'delete' ? modalState.question : null

  return (
    <div className="flex flex-col gap-gutter">
      <QbankQuestionsPageHeader onAddQuestion={handleAddQuestion} />

      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        {subjectsError ? (
          <TableErrorState message={subjectsError} onRetry={handleRetrySubjects} />
        ) : (
          <SelectField
            id="qbank-questions-subject-select"
            label="Select Subject"
            value={selectedSubjectId}
            options={subjectOptions}
            disabled={isLoadingSubjects}
            placeholder={
              isSubjectsInitialLoading ? 'Loading subjects...' : 'Select a qbank subject'
            }
            onChange={handleSubjectChange}
          />
        )}

        {selectedSubject ? (
          <p className="mt-3 text-body-md text-on-surface-variant">
            Showing questions for{' '}
            <span className="font-medium text-black">
              {selectedSubject.subjectName || selectedSubject.id}
            </span>
          </p>
        ) : null}

        {hasSubjectSelected ? (
          <div className="mt-gutter">
            {chaptersError ? (
              <TableErrorState message={chaptersError} onRetry={handleRetryChapters} />
            ) : (
              <SelectField
                id="qbank-questions-chapter-select"
                label="Select Chapter"
                value={selectedChapterId}
                options={chapterOptions}
                disabled={isLoadingChapters}
                placeholder={
                  isChaptersInitialLoading ? 'Loading chapters...' : 'Select a chapter'
                }
                onChange={handleChapterChange}
              />
            )}

            {selectedChapter ? (
              <p className="mt-3 text-body-md text-on-surface-variant">
                Chapter:{' '}
                <span className="font-medium text-black">
                  {selectedChapter.chapterName || selectedChapter.id}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <QbankQuestionsTable
        questions={questions}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoadingQuestions}
        isInitialLoading={isQuestionsInitialLoading}
        hasSubjectSelected={hasSubjectSelected}
        hasChapterSelected={hasChapterSelected}
        error={questionsError}
        errorIndexUrl={questionsIndexUrl}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetryQuestions}
        onQuestionClick={handleQuestionClick}
        onEdit={handleEditQuestion}
        onDelete={handleDeleteQuestion}
      />

      <ViewQbankQuestionModal
        isOpen={selectedQuestion !== null}
        question={selectedQuestion}
        subjectName={subjectDisplayName}
        onClose={handleCloseQuestionModal}
      />

      <EditQbankQuestionModal
        isOpen={isFormModalOpen}
        subjectId={selectedSubjectId}
        chapterId={selectedChapterId}
        subjectName={subjectDisplayName}
        chapterName={chapterDisplayName}
        moduleName={selectedChapter?.moduleName ?? ''}
        mcqMid={selectedSubject?.mcqMid ?? null}
        question={editingQuestion}
        onClose={handleCloseModal}
        onSaved={handleQuestionsUpdated}
      />

      <DeleteQbankQuestionModal
        isOpen={deletingQuestion !== null}
        question={deletingQuestion}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
