import { PLAN_SECTIONS, type PlanSectionConfig } from '@/config/plan-sections'
import { usePlanSection } from '@/hooks/usePlanSection'
import { formatSellingPrice } from '@/lib/format-price'
import { PLANS_PAGE_SIZE } from '@/lib/plans'
import { formatPlanModules, isFreePlan } from '@/lib/plan-utils'
import type { Plan } from '@/types/plan'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { StatusBadge } from '@/components/banners/StatusBadge'
import { Button } from '@/components/ui/Button'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TableLoadingOverlay } from '@/components/ui/table/TableLoadingOverlay'
import { TableEmptyRow } from '@/components/ui/table/TablePlaceholderRows'
import { TablePagination } from '@/components/ui/table/TablePagination'
import {
  TableBody,
  TableCell,
  TableElement,
  TableErrorState,
  TableFooterMessage,
  TableHeader,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
  TableScrollArea,
} from '@/components/ui/table'

interface PlansSectionsProps {
  refreshKey: number
  onEdit: (plan: Plan) => void
  onEditSortOrder: (section: PlanSectionConfig) => void
}

const SECTION_COLUMN_WIDTHS = [
  undefined,
  'w-[140px]',
  undefined,
  'w-[130px]',
  'w-[180px]',
]

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

const sectionHeadCellClassName =
  'px-gutter py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant'

function PlanSectionSkeletonRows() {
  return Array.from({ length: PLANS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`section-skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-full max-w-[280px] animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-20 animate-pulse rounded-full bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-24 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function PlanSectionHeader({
  section,
  onEditSortOrder,
}: {
  section: PlanSectionConfig
  onEditSortOrder: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-gutter py-5">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed"
        >
          <MaterialIcon name={section.icon} size={20} className="text-primary" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id={`plan-section-${section.key}`}
            className="text-card-title text-on-surface"
          >
            {section.title}
          </h2>
          <p className="text-body-md text-on-surface-variant">{section.description}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onEditSortOrder}
        className="shrink-0 gap-2"
      >
        <MaterialIcon name="swap_vert" size={16} />
        Edit sort order
      </Button>
    </div>
  )
}

const freePlanRowClassName = 'bg-surface-container-low opacity-60'
const freePlanTextClassName = 'text-on-surface-variant'

function PlanSectionRow({
  plan,
  onEdit,
  onToggleIsActive,
}: {
  plan: Plan
  onEdit: (plan: Plan) => void
  onToggleIsActive: (id: string, isActive: boolean) => void
}) {
  const isFree = isFreePlan(plan)

  return (
    <TableRow className={isFree ? freePlanRowClassName : undefined}>
      <TableCell
        className={[
          'font-medium',
          isFree ? freePlanTextClassName : 'text-text-black',
        ].join(' ')}
      >
        {plan.planName || '—'}
      </TableCell>
      <TableCell
        className={[
          'whitespace-nowrap text-body-md',
          isFree ? freePlanTextClassName : 'text-text-black',
        ].join(' ')}
      >
        {isFree ? 'Free' : formatSellingPrice(plan.sellingPrice)}
      </TableCell>
      <TableCell
        className={[
          'max-w-0 text-body-md',
          isFree ? freePlanTextClassName : 'text-text-black',
        ].join(' ')}
        title={formatPlanModules(plan.planModules)}
      >
        <span className="block truncate">{formatPlanModules(plan.planModules)}</span>
      </TableCell>
      <TableCell>
        <StatusBadge isActive={plan.isActive} />
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <ActiveToggle
            isActive={plan.isActive}
            disabled={isFree}
            ariaLabel={`Toggle status for plan ${plan.planName || plan.id}`}
            onChange={(isActive) => onToggleIsActive(plan.id, isActive)}
          />
          <button
            type="button"
            aria-label={`Edit plan ${plan.planName || plan.id}`}
            onClick={() => onEdit(plan)}
            disabled={isFree}
            className={[
              actionButtonClassName,
              isFree ? 'cursor-not-allowed opacity-40' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <MaterialIcon
              name="edit"
              size={16}
              className="text-on-surface-variant"
            />
          </button>
          <CopyIdButton
            value={plan.planId}
            ariaLabel={`Copy plan id ${plan.planId}`}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}

function PlanSectionCard({
  section,
  refreshKey,
  onEdit,
  onEditSortOrder,
}: {
  section: PlanSectionConfig
  refreshKey: number
  onEdit: (plan: Plan) => void
  onEditSortOrder: (section: PlanSectionConfig) => void
}) {
  const {
    plans,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    indexUrl,
    actionError,
    hasNext,
    hasPrevious,
    handleNext,
    handlePrevious,
    handleRetry,
    handleToggleIsActive,
  } = usePlanSection(section.planType, refreshKey)

  if (error) {
    return (
      <section
        aria-labelledby={`plan-section-${section.key}`}
        className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1"
      >
        <PlanSectionHeader
          section={section}
          onEditSortOrder={() => onEditSortOrder(section)}
        />
        <TableErrorState
          message={error}
          indexUrl={indexUrl}
          variant="embedded"
          onRetry={handleRetry}
        />
      </section>
    )
  }

  return (
    <section
      aria-labelledby={`plan-section-${section.key}`}
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1"
    >
      <PlanSectionHeader
        section={section}
        onEditSortOrder={() => onEditSortOrder(section)}
      />
      <TableScrollArea
        isPageLoading={isPageLoading}
        loadingOverlay={<TableLoadingOverlay />}
      >
        <TableElement columnWidths={SECTION_COLUMN_WIDTHS}>
          <TableHeader>
            <TableHeaderRow>
              <TableHeadCell className={sectionHeadCellClassName}>
                Plan Name
              </TableHeadCell>
              <TableHeadCell className={sectionHeadCellClassName}>
                Amount
              </TableHeadCell>
              <TableHeadCell className={sectionHeadCellClassName}>
                Modules
              </TableHeadCell>
              <TableHeadCell className={sectionHeadCellClassName}>
                Status
              </TableHeadCell>
              <TableHeadCell align="center" className={`${sectionHeadCellClassName} px-3`}>
                Actions
              </TableHeadCell>
            </TableHeaderRow>
          </TableHeader>
          <TableBody isPageLoading={isPageLoading}>
            {isInitialLoading ? (
              <PlanSectionSkeletonRows />
            ) : plans.length === 0 ? (
              <TableEmptyRow columnCount={5}>
                No {section.title.toLowerCase()} yet.
              </TableEmptyRow>
            ) : (
              plans.map((plan) => (
                <PlanSectionRow
                  key={plan.id}
                  plan={plan}
                  onEdit={onEdit}
                  onToggleIsActive={handleToggleIsActive}
                />
              ))
            )}
          </TableBody>
        </TableElement>
      </TableScrollArea>

      {actionError ? (
        <TableFooterMessage>{actionError}</TableFooterMessage>
      ) : null}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </section>
  )
}

export function PlansSections({
  refreshKey,
  onEdit,
  onEditSortOrder,
}: PlansSectionsProps) {
  return (
    <div className="flex flex-col gap-gutter">
      {PLAN_SECTIONS.map((section) => (
        <PlanSectionCard
          key={section.key}
          section={section}
          refreshKey={refreshKey}
          onEdit={onEdit}
          onEditSortOrder={onEditSortOrder}
        />
      ))}
    </div>
  )
}
