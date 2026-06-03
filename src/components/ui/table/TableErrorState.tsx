interface TableErrorStateProps {
  message: string
  onRetry: () => void
}

export function TableErrorState({ message, onRetry }: TableErrorStateProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-white p-gutter shadow-tier-1">
      <p className="mb-4 text-body-md text-error-red" role="alert">
        {message}
      </p>
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
