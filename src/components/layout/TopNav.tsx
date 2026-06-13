import { signOut } from 'firebase/auth'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getBreadcrumbs, getNavItemByPath } from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { auth } from '@/lib/firebase'

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isProfileMenuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileMenuOpen])

  function handleToggleProfileMenu() {
    setIsProfileMenuOpen((open) => !open)
  }

  async function handleLogout() {
    setIsSigningOut(true)
    setIsProfileMenuOpen(false)
    try {
      await signOut(auth)
    } catch {
      setIsSigningOut(false)
    }
  }

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

        <div
          ref={profileMenuRef}
          className="relative flex items-center border-l border-outline-variant pl-[25px]"
        >
          <button
            type="button"
            aria-label="Profile menu"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-controls="profile-menu"
            onClick={handleToggleProfileMenu}
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
              name="expand_more"
              size={18}
              className={[
                'text-on-surface-variant transition-transform',
                isProfileMenuOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {isProfileMenuOpen ? (
            <div
              id="profile-menu"
              role="menu"
              aria-label="Profile menu"
              className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] overflow-hidden rounded-lg border border-outline-variant bg-surface-white py-1 shadow-tier-2"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-body-md text-on-surface-variant transition hover:bg-row-hover hover:text-on-surface focus-visible:bg-row-hover focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MaterialIcon name="logout" size={18} />
                {isSigningOut ? 'Signing out...' : 'Logout'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
