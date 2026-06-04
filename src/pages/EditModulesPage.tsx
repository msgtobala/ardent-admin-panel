import { useMemo, useState } from 'react'
import { EditModuleModal } from '@/components/video-modules/EditModuleModal'
import { EditModulesPageHeader } from '@/components/video-modules/EditModulesPageHeader'
import { EditModulesTable } from '@/components/video-modules/EditModulesTable'
import { useEditModulesPage } from '@/hooks/useEditModulesPage'
import type { VideoModuleListItem } from '@/types/video-module'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TableErrorState } from '@/components/ui/table'

export default function EditModulesPage() {
  const [editingModule, setEditingModule] = useState<VideoModuleListItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    subjects,
    selectedSubjectId,
    selectedSubject,
    modules,
    isLoadingSubjects,
    isLoadingModules,
    subjectsError,
    modulesError,
    modulesIndexUrl,
    handleSubjectChange,
    handleRetrySubjects,
    handleRetryModules,
    handleModulesSaved,
    isModulesInitialLoading,
  } = useEditModulesPage(refreshKey)

  const subjectOptions: SelectOption[] = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject.id,
        label: subject.subjectName.trim() || subject.id,
      })),
    [subjects],
  )

  function handleEditModule(module: VideoModuleListItem) {
    setEditingModule(module)
  }

  function handleCloseModal() {
    setEditingModule(null)
  }

  function handleModuleSaved() {
    setRefreshKey((prev) => prev + 1)
    handleModulesSaved()
  }

  return (
    <div className="flex flex-col gap-gutter">
      <EditModulesPageHeader />

      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        {subjectsError ? (
          <TableErrorState message={subjectsError} onRetry={handleRetrySubjects} />
        ) : (
          <SelectField
            id="edit-modules-subject-select"
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
            Showing modules for{' '}
            <span className="font-medium text-black">
              {selectedSubject.subjectName || selectedSubject.id}
            </span>
          </p>
        ) : null}
      </section>

      <EditModulesTable
        modules={modules}
        isLoading={isLoadingModules}
        isInitialLoading={isModulesInitialLoading}
        hasSubjectSelected={Boolean(selectedSubjectId)}
        error={modulesError}
        errorIndexUrl={modulesIndexUrl}
        onRetry={handleRetryModules}
        onEdit={handleEditModule}
      />

      <EditModuleModal
        key={editingModule ? `edit-module-${editingModule.name}` : 'edit-module-closed'}
        isOpen={editingModule !== null}
        subjectId={selectedSubjectId}
        module={editingModule}
        onClose={handleCloseModal}
        onSaved={handleModuleSaved}
      />
    </div>
  )
}
