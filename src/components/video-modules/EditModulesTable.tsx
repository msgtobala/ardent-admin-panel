import type { VideoModuleListItem } from '@/types/video-module'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  DataTable,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'

const EDIT_MODULES_TABLE_PAGE_SIZE = 10

interface EditModulesTableProps {
  modules: VideoModuleListItem[]
  isLoading: boolean
  isInitialLoading: boolean
  hasSubjectSelected: boolean
  error?: string
  errorIndexUrl?: string
  onRetry: () => void
  onEdit: (module: VideoModuleListItem) => void
}

const COLUMN_WIDTHS = [undefined, 'w-[140px]', 'w-[120px]']

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function EditModulesSkeletonRows() {
  return Array.from({ length: EDIT_MODULES_TABLE_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`edit-module-skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-56 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-4 w-10 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-10 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function EditModuleRow({
  module,
  onEdit,
}: {
  module: VideoModuleListItem
  onEdit: (module: VideoModuleListItem) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-text-black">
        <span className="block truncate">{module.name}</span>
      </TableCell>
      <TableCell className="text-center text-body-md text-text-black">
        {module.lessonCount}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center">
          <button
            type="button"
            aria-label={`Edit module ${module.name}`}
            onClick={() => onEdit(module)}
            className={actionButtonClassName}
          >
            <MaterialIcon name="edit" size={16} className="text-primary-action" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function EditModulesTable({
  modules,
  isLoading,
  isInitialLoading,
  hasSubjectSelected,
  error,
  errorIndexUrl,
  onRetry,
  onEdit,
}: EditModulesTableProps) {
  if (!hasSubjectSelected) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-10 shadow-tier-1">
        <p className="text-center text-body-md text-on-surface-variant">
          Select a video subject to view modules.
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter shadow-tier-1">
        <TableErrorState message={error} indexUrl={errorIndexUrl} onRetry={onRetry} />
      </section>
    )
  }

  const emptyMessage = isLoading
    ? 'Loading modules...'
    : 'No modules found for this subject. Module names appear after lessons are assigned to a module.'

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-white shadow-tier-1">
      <DataTable
        columnCount={3}
        columnWidths={COLUMN_WIDTHS}
        minWidth={560}
        header={
          <TableHeaderRow>
            <TableHeadCell>Module Name</TableHeadCell>
            <TableHeadCell className="text-center">Lessons</TableHeadCell>
            <TableHeadCell className="text-center">Actions</TableHeadCell>
          </TableHeaderRow>
        }
        skeletonRows={<EditModulesSkeletonRows />}
        emptyMessage={emptyMessage}
        rowCount={modules.length}
        pageSize={EDIT_MODULES_TABLE_PAGE_SIZE}
        isInitialLoading={isInitialLoading}
        isPageLoading={false}
        isLoading={isLoading}
        currentPage={1}
        totalPages={1}
        hasNext={false}
        hasPrevious={false}
        onNext={() => undefined}
        onPrevious={() => undefined}
      >
        {modules.map((module) => (
          <EditModuleRow key={module.name} module={module} onEdit={onEdit} />
        ))}
      </DataTable>
    </section>
  )
}
