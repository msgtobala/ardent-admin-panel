import { useMemo, useState } from 'react'
import { GenerateThumbnailLessonsTable } from '@/components/videos/generate-thumbnail/GenerateThumbnailLessonsTable'
import { GenerateThumbnailPageHeader } from '@/components/videos/generate-thumbnail/GenerateThumbnailPageHeader'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { useGenerateThumbnailPage } from '@/hooks/useGenerateThumbnailPage'
import type { VideoLesson } from '@/types/video-lesson'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TableErrorState } from '@/components/ui/table'

export default function GenerateThumbnailPage() {
  const { showSnackbar } = useSnackbar()
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    subjects,
    selectedSubjectId,
    selectedSubject,
    lessons,
    missingThumbnailCount,
    isLoadingSubjects,
    isLoadingLessons,
    subjectsError,
    lessonsError,
    lessonsIndexUrl,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    generatingLessonId,
    bulkGenerating,
    isGenerating,
    handleSubjectChange,
    handleNext,
    handlePrevious,
    handleRetrySubjects,
    handleRetryLessons,
    handleGenerateThumbnail,
    handleGenerateAllMissing,
    isLessonsInitialLoading,
    isLessonsPageLoading,
  } = useGenerateThumbnailPage(refreshKey)

  const subjectOptions: SelectOption[] = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject.id,
        label: subject.subjectName.trim() || subject.id,
      })),
    [subjects],
  )

  async function handleGenerate(lesson: VideoLesson) {
    try {
      await handleGenerateThumbnail(lesson)
      showSnackbar(`Thumbnail generated for ${lesson.lessonName.trim() || lesson.id}`)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate thumbnail. Please try again.'
      showSnackbar(message)
    }
  }

  async function handleGenerateAll() {
    if (missingThumbnailCount === 0) {
      showSnackbar('All lessons with video already have thumbnails.')
      return
    }

    try {
      await handleGenerateAllMissing()
      showSnackbar(
        `Generated ${missingThumbnailCount} thumbnail${missingThumbnailCount === 1 ? '' : 's'}`,
      )
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate thumbnails. Please try again.'
      showSnackbar(message)
    }
  }

  return (
    <div className="flex flex-col gap-gutter">
      <GenerateThumbnailPageHeader
        missingThumbnailCount={missingThumbnailCount}
        hasSubjectSelected={Boolean(selectedSubjectId)}
        isGenerating={isGenerating}
        onGenerateAllMissing={handleGenerateAll}
      />

      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        {subjectsError ? (
          <TableErrorState message={subjectsError} onRetry={handleRetrySubjects} />
        ) : (
          <SelectField
            id="generate-thumbnail-subject-select"
            label="Select Subject"
            value={selectedSubjectId}
            options={subjectOptions}
            disabled={isLoadingSubjects}
            placeholder={
              isLoadingSubjects ? 'Loading subjects...' : 'Select a video subject'
            }
            onChange={handleSubjectChange}
          />
        )}
        {selectedSubject ? (
          <p className="mt-3 text-body-md text-on-surface-variant">
            Showing lessons for{' '}
            <span className="font-medium !text-black">
              {selectedSubject.subjectName || selectedSubject.id}
            </span>{' '}
            ({selectedSubject.totalLessons} total)
          </p>
        ) : null}
      </section>

      <GenerateThumbnailLessonsTable
        lessons={lessons}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoadingLessons}
        isInitialLoading={isLessonsInitialLoading}
        isPageLoading={isLessonsPageLoading}
        hasSubjectSelected={Boolean(selectedSubjectId)}
        error={lessonsError}
        errorIndexUrl={lessonsIndexUrl}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        generatingLessonId={generatingLessonId}
        bulkGenerating={bulkGenerating}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetryLessons}
        onGenerate={handleGenerate}
      />
    </div>
  )
}
