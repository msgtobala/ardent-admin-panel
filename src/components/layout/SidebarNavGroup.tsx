import { useEffect, useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getSidebarVisibleNavChildren, type NavCollapsibleGroup } from '@/config/navigation'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface SidebarNavGroupProps {
  group: NavCollapsibleGroup
}

const childNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 border-l-4 py-2.5 pl-12 pr-gutter text-body-md font-medium transition',
    isActive
      ? 'border-primary-action bg-surface text-primary-action'
      : 'border-transparent text-on-surface-variant hover:bg-row-hover',
  ].join(' ')

export function SidebarNavGroup({ group }: SidebarNavGroupProps) {
  const { pathname } = useLocation()
  const panelId = useId()
  const visibleChildren = getSidebarVisibleNavChildren(group.children)
  const isChildActive = group.children.some((child) => pathname === child.path)
  const [isExpanded, setIsExpanded] = useState(isChildActive)

  useEffect(() => {
    if (isChildActive) setIsExpanded(true)
  }, [isChildActive])

  function handleToggle() {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className={[
          'flex w-full cursor-pointer items-center gap-3 border-l-4 py-3 pl-7 pr-gutter text-left text-body-md font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          isChildActive
            ? 'border-primary-action bg-surface text-primary-action'
            : 'border-transparent text-on-surface-variant hover:bg-row-hover',
        ].join(' ')}
      >
        <MaterialIcon name={group.icon} size={18} />
        <span className="flex-1">{group.label}</span>
        <MaterialIcon
          name={isExpanded ? 'expand_less' : 'expand_more'}
          size={18}
          className="shrink-0 text-on-surface-variant"
        />
      </button>

      {isExpanded ? (
        <div id={panelId} className="flex flex-col">
          {visibleChildren.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              className={childNavLinkClassName}
            >
              <MaterialIcon name={child.icon} size={18} />
              {child.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}
