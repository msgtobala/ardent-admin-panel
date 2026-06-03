type CircularLoaderSize = 'sm' | 'md' | 'lg'

interface CircularLoaderProps {
  size?: CircularLoaderSize
  label?: string
  className?: string
}

const sizeClasses: Record<CircularLoaderSize, string> = {
  sm: 'size-5 border-2',
  md: 'size-10 border-[3px]',
  lg: 'size-14 border-4',
}

export function CircularLoader({
  size = 'md',
  label = 'Loading',
  className = '',
}: CircularLoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={[
        'inline-block animate-spin rounded-full border-primary-action border-t-transparent',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
