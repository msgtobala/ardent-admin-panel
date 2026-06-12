import { useState } from 'react'
import { TenMinsConceptPageHeader } from '@/components/ten-mins-concept/TenMinsConceptPageHeader'
import { TenMinsConceptTable } from '@/components/ten-mins-concept/TenMinsConceptTable'
import { ViewVideoLessonModal } from '@/components/videos/ViewVideoLessonModal'
import { useTenMinsConcept } from '@/hooks/useTenMinsConcept'
import type { ResolvedTenMinsConcept } from '@/types/ten-mins-concept'

export default function TenMinsConceptPage() {
  const { concept, isLoading, isSuggesting, error, handleRetry, handleSuggest } =
    useTenMinsConcept()
  const [viewingConcept, setViewingConcept] = useState<ResolvedTenMinsConcept | null>(
    null,
  )

  function handleViewConcept(nextConcept: ResolvedTenMinsConcept) {
    setViewingConcept(nextConcept)
  }

  function handleCloseView() {
    setViewingConcept(null)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <TenMinsConceptPageHeader
        onSuggest={() => {
          void handleSuggest()
        }}
        isSuggesting={isSuggesting}
      />
      <TenMinsConceptTable
        concept={concept}
        isLoading={isLoading}
        isSuggesting={isSuggesting}
        error={error}
        onRetry={handleRetry}
        onView={handleViewConcept}
      />
      <ViewVideoLessonModal
        isOpen={viewingConcept !== null}
        lesson={viewingConcept}
        subtitle="10 mins concept preview"
        onClose={handleCloseView}
      />
    </div>
  )
}
