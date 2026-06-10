import { useCallback, useMemo, useState } from 'react'

import { EditQbankChapterModal } from '@/components/qbank-chapters/EditQbankChapterModal'
import { QbankChaptersPageHeader } from '@/components/qbank-chapters/QbankChaptersPageHeader'
import { QbankChaptersTable } from '@/components/qbank-chapters/QbankChaptersTable'
import { ReorderQbankChaptersModal } from '@/components/qbank-chapters/ReorderQbankChaptersModal'
import { ViewQbankChapterModal } from '@/components/qbank-chapters/ViewQbankChapterModal'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { useQbankChaptersPage } from '@/hooks/useQbankChaptersPage'
import type { QbankChapter } from '@/types/qbank-chapter'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TableErrorState } from '@/components/ui/table'

type QbankChapterModalState =
  | { mode: 'add' }
  | { mode: 'edit'; chapter: QbankChapter }
  | null

export default function QbankChaptersPage() {
  const { showSnackbar } = useSnackbar()
  const [selectedChapter, setSelectedChapter] = useState<QbankChapter | null>(null)
  const [modalState, setModalState] = useState<QbankChapterModalState>(null)
  const [isReorderOpen, setIsReorderOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    subjects,
    selectedSubjectId,
    selectedSubject,
    chapters,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    isLoadingSubjects,
    isLoadingChapters,
    isSubjectsInitialLoading,
    isChaptersInitialLoading,
    isChaptersPageLoading,
    subjectsError,
    chaptersError,
    chaptersIndexUrl,
    handleSubjectChange,
    handleNext,
    handlePrevious,
    handleSort,
    handleRetrySubjects,
    handleRetryChapters,
  } = useQbankChaptersPage(refreshKey)

  const subjectOptions: SelectOption[] = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject.id,
        label: subject.subjectName.trim() || subject.id,
      })),
    [subjects],
  )

  const hasSubjectSelected = Boolean(selectedSubjectId)

  const handleViewChapter = useCallback((chapter: QbankChapter) => {
    setSelectedChapter(chapter)
  }, [])

  const handleAddChapter = useCallback(() => {
    if (!selectedSubjectId) {
      showSnackbar('Select a qbank subject before adding a chapter.')
      return
    }

    setModalState({ mode: 'add' })
  }, [selectedSubjectId, showSnackbar])

  const handleEditChapter = useCallback((chapter: QbankChapter) => {
    setModalState({ mode: 'edit', chapter })
  }, [])

  const handleCloseViewModal = useCallback(() => {
    setSelectedChapter(null)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setModalState(null)
  }, [])

  const handleOpenReorderModal = useCallback(() => {
    if (!selectedSubjectId) {
      showSnackbar('Select a qbank subject before editing sort order.')
      return
    }

    setIsReorderOpen(true)
  }, [selectedSubjectId, showSnackbar])

  const handleCloseReorderModal = useCallback(() => {
    setIsReorderOpen(false)
  }, [])

  const handleChaptersUpdated = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  const isFormModalOpen =
    modalState?.mode === 'add' || modalState?.mode === 'edit'
  const editingChapter =
    modalState?.mode === 'edit' ? modalState.chapter : null

  return (
    <div className="flex flex-col gap-gutter">
      <QbankChaptersPageHeader
        onAddChapter={handleAddChapter}
        onEditSortOrder={handleOpenReorderModal}
      />

      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        {subjectsError ? (
          <TableErrorState message={subjectsError} onRetry={handleRetrySubjects} />
        ) : (
          <SelectField
            id="qbank-chapters-subject-select"
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
            Showing chapters for{' '}
            <span className="font-medium text-black">
              {selectedSubject.subjectName || selectedSubject.id}
            </span>
          </p>
        ) : null}
      </section>

      <QbankChaptersTable
        chapters={chapters}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoadingChapters}
        isInitialLoading={isChaptersInitialLoading}
        isPageLoading={isChaptersPageLoading}
        hasSubjectSelected={hasSubjectSelected}
        error={chaptersError}
        errorIndexUrl={chaptersIndexUrl}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetryChapters}
        onView={handleViewChapter}
        onEdit={handleEditChapter}
      />

      <ViewQbankChapterModal
        isOpen={selectedChapter != null}
        chapter={selectedChapter}
        onClose={handleCloseViewModal}
      />

      <EditQbankChapterModal
        key={
          modalState === null
            ? 'closed'
            : modalState.mode === 'add'
              ? 'add'
              : `edit-${modalState.chapter.id}`
        }
        isOpen={isFormModalOpen}
        subjectId={selectedSubjectId}
        subjectName={selectedSubject?.subjectName ?? ''}
        chapter={editingChapter}
        onClose={handleCloseEditModal}
        onSaved={handleChaptersUpdated}
      />

      <ReorderQbankChaptersModal
        key={isReorderOpen ? 'reorder-qbank-chapters-open' : 'reorder-qbank-chapters-closed'}
        isOpen={isReorderOpen}
        subjectId={selectedSubjectId}
        subjectName={selectedSubject?.subjectName ?? ''}
        onClose={handleCloseReorderModal}
        onSaved={handleChaptersUpdated}
      />
    </div>
  )
}
