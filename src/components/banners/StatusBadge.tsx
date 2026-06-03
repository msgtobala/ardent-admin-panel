interface StatusBadgeProps {
  isActive: boolean
}

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-body-md font-normal',
        isActive
          ? 'bg-success-bg text-success-green'
          : 'bg-error-bg text-error-red',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'size-1.5 rounded-full',
          isActive ? 'bg-success-green' : 'bg-error-red',
        ].join(' ')}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
