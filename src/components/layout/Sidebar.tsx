import { NavLink } from 'react-router-dom'
import ardentLogo from '@/assets/ardent-logo.png'
import { NAV_COLLAPSIBLE_GROUPS, NAV_ITEMS } from '@/config/navigation'
import { SidebarNavGroup } from './SidebarNavGroup'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

export function Sidebar() {
  return (
    <aside className="flex h-full w-sidebar-width shrink-0 flex-col border-r border-border-subtle bg-surface-white py-gutter shadow-tier-1">
      <div className="mb-8 px-gutter">
        <div className="flex items-center gap-3">
          <img
            src={ardentLogo}
            alt="Ardent"
            className="h-10 w-auto"
            width={51}
            height={40}
          />
          <div className="flex flex-col">
            <span className="text-h2 font-bold text-primary-action">Ardent</span>
            <span className="text-caption text-on-surface-variant">LMS Admin</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 border-l-4 py-3 pl-7 pr-gutter text-body-md font-semibold transition',
                isActive
                  ? 'border-primary-action bg-surface text-primary-action'
                  : 'border-transparent text-on-surface-variant hover:bg-row-hover',
              ].join(' ')
            }
          >
            <MaterialIcon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
        {NAV_COLLAPSIBLE_GROUPS.map((group) => (
          <SidebarNavGroup key={group.label} group={group} />
        ))}
      </nav>
    </aside>
  )
}
