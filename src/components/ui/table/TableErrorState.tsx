interface TableErrorStateProps {
  message: string
  onRetry: () => void
  indexUrl?: string
  variant?: 'standalone' | 'embedded'
}

export function TableErrorState({
  message,
  onRetry,
  indexUrl,
  variant = 'standalone',
}: TableErrorStateProps) {
  const containerClassName =
    variant === 'embedded'
      ? 'mx-gutter mb-gutter rounded-xl border border-border-subtle bg-surface-white px-gutter py-gutter'
      : 'rounded-xl border border-border-subtle bg-surface-white p-gutter shadow-tier-1'

  return (
    <div className={containerClassName}>
      <p className="mb-4 text-body-md text-error-red" role="alert">
        {message}
      </p>
      {indexUrl ? (
        <p className="mb-4 text-body-md text-on-surface-variant">
          <a
            href={indexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary underline transition hover:text-primary-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Create Firestore index
          </a>
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-input border border-border-subtle px-[17px] py-[9px] text-body-md text-on-surface transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        Retry
      </button>
    </div>
  )
}
