type MaterialIconProps = {
  name: string
  className?: string
  size?: 16 | 18 | 20 | 24
}

const sizeClasses: Record<NonNullable<MaterialIconProps['size']>, string> = {
  16: 'text-[16px]',
  18: 'text-[18px]',
  20: 'text-[20px]',
  24: 'text-[24px]',
}

export function MaterialIcon({
  name,
  className = '',
  size = 20,
}: MaterialIconProps) {
  return (
    <span
      className={[
        'material-symbols-outlined leading-none select-none',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {name}
    </span>
  )
}
