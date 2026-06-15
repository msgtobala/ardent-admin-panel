import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GrandTestForm } from '@/components/grand-tests/GrandTestForm'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TableErrorState } from '@/components/ui/table'
import { fetchGrandTestForEdit } from '@/lib/grand-test-edit'
import type { GrandTestEditFormData } from '@/types/grand-test'

function EditGrandTestFormSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1"
    >
      <div className="border-b border-border-subtle px-gutter py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`step-skeleton-${index}`} className="flex flex-1 flex-col items-center gap-2">
              <div className="size-8 animate-pulse rounded-full bg-surface-container" />
              <div className="h-3 w-20 animate-pulse rounded bg-surface-container" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 px-gutter py-gutter">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`field-skeleton-${index}`} className="h-10 animate-pulse rounded bg-surface-container" />
        ))}
      </div>
    </div>
  )
}

export default function EditGrandTestPage() {
  const navigate = useNavigate()
  const { testId } = useParams<{ testId: string }>()
  const [initialData, setInitialData] = useState<GrandTestEditFormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!testId) {
      setError('Test id is missing')
      setIsLoading(false)
      return
    }

    const resolvedTestId = testId
    let isCancelled = false

    async function loadGrandTest() {
      setIsLoading(true)
      setError(undefined)

      try {
        const formData = await fetchGrandTestForEdit(resolvedTestId)
        if (!isCancelled) {
          setInitialData(formData)
        }
      } catch (loadError) {
        if (!isCancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load grand test. Please try again.'
          setError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadGrandTest()

    return () => {
      isCancelled = true
    }
  }, [testId])

  function handleCancel() {
    navigate('/grand-tests/active')
  }

  function handleSaved() {
    navigate('/grand-tests/active')
  }

  function handleRetry() {
    if (!testId) return
    setInitialData(null)
    setError(undefined)
    setIsLoading(true)

    void fetchGrandTestForEdit(testId)
      .then((formData) => {
        setInitialData(formData)
        setIsLoading(false)
      })
      .catch((loadError) => {
        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load grand test. Please try again.'
        setError(message)
        setIsLoading(false)
      })
  }

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex flex-col gap-2">
        <Link
          to="/grand-tests/active"
          className="inline-flex w-fit items-center gap-1 text-body-md font-medium text-primary transition hover:text-primary-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <MaterialIcon name="arrow_back" size={18} />
          Back to Active Tests
        </Link>
        <div className="flex max-w-6xl flex-col gap-2">
          <h1 className="text-section-title text-on-surface">Edit Test</h1>
          <p className="text-body-md text-on-surface-variant">
            Update test details, questions, and preview changes before saving
          </p>
        </div>
      </div>

      {error ? (
        <TableErrorState message={error} onRetry={handleRetry} />
      ) : null}

      {isLoading ? <EditGrandTestFormSkeleton /> : null}

      {!isLoading && !error && initialData && testId ? (
        <GrandTestForm
          mode="edit"
          testId={testId}
          initialData={initialData}
          onCancel={handleCancel}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  )
}
