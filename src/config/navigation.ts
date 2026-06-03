export interface NavItem {
  label: string
  path: string
  icon: string
  breadcrumbs: {
    parent: string
    current: string
  }
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    breadcrumbs: { parent: 'Dashboard', current: 'Overview' },
  },
  {
    label: 'Banners',
    path: '/banners',
    icon: 'panorama',
    breadcrumbs: { parent: 'Banners', current: 'Overview' },
  },
  {
    label: 'Faculties',
    path: '/faculties',
    icon: 'school',
    breadcrumbs: { parent: 'Faculties', current: 'Overview' },
  },
  {
    label: 'Plans',
    path: '/plans',
    icon: 'payments',
    breadcrumbs: { parent: 'Plans', current: 'Overview' },
  },
  {
    label: 'Students',
    path: '/students',
    icon: 'group',
    breadcrumbs: { parent: 'Students', current: 'Overview' },
  },
  {
    label: 'Grand Tests',
    path: '/grand-tests',
    icon: 'assignment',
    breadcrumbs: { parent: 'Grand Tests', current: 'Overview' },
  },
  {
    label: 'QBanks',
    path: '/qbanks',
    icon: 'quiz',
    breadcrumbs: { parent: 'QBanks', current: 'Overview' },
  },
  {
    label: '3 Min Challenges',
    path: '/3-min-challenges',
    icon: 'timer',
    breadcrumbs: { parent: '3 Min Challenges', current: 'Overview' },
  },
]

export function getBreadcrumbs(pathname: string): NavItem['breadcrumbs'] {
  const item = NAV_ITEMS.find((navItem) => navItem.path === pathname)
  return item?.breadcrumbs ?? { parent: 'Dashboard', current: 'Overview' }
}

export function getNavItemByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((navItem) => navItem.path === pathname)
}
