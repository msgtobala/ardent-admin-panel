import { Link, useLocation } from 'react-router-dom'
import { getBreadcrumbs, getNavItemByPath } from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

function getDisplayName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  if (displayName) return displayName
  if (email) return email.split('@')[0]
  return 'Admin User'
}

function getInitials(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = getDisplayName(displayName, email)
  return name.slice(0, 2).toUpperCase()
}

export function TopNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const breadcrumbs = getBreadcrumbs(pathname)
  const navItem = getNavItemByPath(pathname)

  return (
    <header className="flex h-topbar-height shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-gutter">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center">
          <li>
            {navItem ? (
              <Link
                to={navItem.path}
                className="text-label-sm font-medium text-primary transition hover:text-primary-action"
              >
                {breadcrumbs.parent}
              </Link>
            ) : (
              <span className="text-label-sm font-medium text-primary">
                {breadcrumbs.parent}
              </span>
            )}
          </li>
          <li className="flex items-center pl-2" aria-hidden>
            <MaterialIcon
              name="chevron_right"
              size={18}
              className="text-on-surface-variant"
            />
          </li>
          <li className="pl-2">
            <span className="text-label-sm font-semibold text-on-surface">
              {breadcrumbs.current}
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-gutter">
        <div className="relative">
          <MaterialIcon
            name="search"
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            type="search"
            placeholder="Search for content, users, or tests..."
            aria-label="Search for content, users, or tests"
            className="h-[38px] w-[500px] max-w-[40vw] rounded-full border border-outline-variant bg-surface-white py-[10px] pl-[49px] pr-[17px] text-body-md text-on-surface placeholder:text-outline/50 focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        <div className="flex items-center border-l border-outline-variant pl-[25px]">
          <button
            type="button"
            aria-label="Profile menu"
            className="flex cursor-pointer items-center gap-3 rounded-full py-[6px] pl-[6px] pr-3 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="size-9 shrink-0 rounded-full border border-outline-variant object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-label-sm font-semibold text-on-surface"
              >
                {getInitials(user?.displayName, user?.email)}
              </span>
            )}
            <span className="flex flex-col items-start text-left">
              <span className="text-label-sm font-semibold text-on-surface">
                {getDisplayName(user?.displayName, user?.email)}
              </span>
              <span className="text-caption uppercase tracking-tight text-on-surface-variant">
                LMS Manager
              </span>
            </span>
            <MaterialIcon
              name="keyboard_arrow_down"
              size={18}
              className="text-on-surface-variant"
            />
          </button>
        </div>
      </div>
    </header>
  )
}
