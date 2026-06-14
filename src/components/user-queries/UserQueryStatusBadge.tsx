import type { UserQueryStatus } from '@/types/user-query'
import { formatUserQueryStatus } from '@/lib/user-query-display'

interface UserQueryStatusBadgeProps {
  status: UserQueryStatus
}

export function UserQueryStatusBadge({ status }: UserQueryStatusBadgeProps) {
  const className = (() => {
    switch (status) {
      case 'opened':
        return 'bg-primary/10 text-primary'
      case 'resolved':
        return 'bg-success-bg text-success-green'
      case 'rejected':
        return 'bg-[#FFECEC] text-[#D20C0C]'
    }
  })()

  const dotClassName = (() => {
    switch (status) {
      case 'opened':
        return 'bg-primary'
      case 'resolved':
        return 'bg-success-green'
      case 'rejected':
        return 'bg-[#D20C0C]'
    }
  })()

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-body-md font-normal',
        className,
      ].join(' ')}
    >
      <span aria-hidden className={['size-1.5 rounded-full', dotClassName].join(' ')} />
      {formatUserQueryStatus(status)}
    </span>
  )
}
