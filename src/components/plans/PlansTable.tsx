import { PLANS_PAGE_SIZE } from '@/lib/plans'
import { formatSellingPrice } from '@/lib/format-price'
import type { Plan, PlanSortField, SortDirection } from '@/types/plan'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { StatusBadge } from '@/components/banners/StatusBadge'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  DataTable,
  SortableTableHeader,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'

interface PlansTableProps {
  plans: Plan[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  isPageLoading: boolean
  error?: string
  actionError?: string
  hasNext: boolean
  hasPrevious: boolean
  sortField: PlanSortField
  sortDirection: SortDirection
  onSort: (field: PlanSortField) => void
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onEdit: (plan: Plan) => void
  onToggleIsActive: (id: string, isActive: boolean) => void
}

const PLAN_COLUMN_WIDTHS = [
  undefined,
  'w-[160px]',
  'w-[140px]',
  'w-[120px]',
  'w-[200px]',
]

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

function PlansTableSkeletonRows() {
  return Array.from({ length: PLANS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-28 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function PlanRow({
  plan,
  onEdit,
  onToggleIsActive,
}: {
  plan: Plan
  onEdit: (plan: Plan) => void
  onToggleIsActive: (id: string, isActive: boolean) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-text-black">{plan.planName || '—'}</TableCell>
      <TableCell className="text-body-md text-text-black">{plan.planType || '—'}</TableCell>
      <TableCell className="whitespace-nowrap text-body-md text-text-black">
        {formatSellingPrice(plan.sellingPrice)}
      </TableCell>
      <TableCell>
        <StatusBadge isActive={plan.isActive} />
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <CopyIdButton
            value={plan.planId}
            ariaLabel={`Copy plan id ${plan.planId}`}
          />
          <button
            type="button"
            aria-label={`Edit plan ${plan.planName || plan.id}`}
            onClick={() => onEdit(plan)}
            className={actionButtonClassName}
          >
            <MaterialIcon
              name="edit"
              size={16}
              className="text-on-surface-variant"
            />
          </button>
          <ActiveToggle
            isActive={plan.isActive}
            ariaLabel={`Toggle status for plan ${plan.planName || plan.id}`}
            onChange={(isActive) => onToggleIsActive(plan.id, isActive)}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}

export function PlansTable({
  plans,
  currentPage,
  totalPages,
  isLoading,
  isInitialLoading,
  isPageLoading,
  error,
  actionError,
  hasNext,
  hasPrevious,
  sortField,
  sortDirection,
  onSort,
  onNext,
  onPrevious,
  onRetry,
  onEdit,
  onToggleIsActive,
}: PlansTableProps) {
  if (error) {
    return <TableErrorState message={error} onRetry={onRetry} />
  }

  return (
    <DataTable
      columnCount={5}
      columnWidths={PLAN_COLUMN_WIDTHS}
      rowCount={plans.length}
      pageSize={PLANS_PAGE_SIZE}
      isInitialLoading={isInitialLoading}
      isPageLoading={isPageLoading}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onNext={onNext}
      onPrevious={onPrevious}
      footerError={actionError}
      emptyMessage="No plans found in Firestore."
      skeletonRows={<PlansTableSkeletonRows />}
      header={
        <TableHeaderRow>
          <SortableTableHeader
            label="Plan Name"
            field="planName"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableTableHeader
            label="Plan Type"
            field="planType"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableTableHeader
            label="Selling Price"
            field="sellingPrice"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableTableHeader
            label="Status"
            field="isActive"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHeadCell align="center" className="px-3">
            Actions
          </TableHeadCell>
        </TableHeaderRow>
      }
    >
      {plans.map((plan) => (
        <PlanRow
          key={plan.id}
          plan={plan}
          onEdit={onEdit}
          onToggleIsActive={onToggleIsActive}
        />
      ))}
    </DataTable>
  )
}
