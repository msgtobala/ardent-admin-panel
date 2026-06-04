export interface NavBreadcrumbs {
  parent: string
  current: string
}

export interface NavItem {
  label: string
  path: string
  icon: string
  breadcrumbs: NavBreadcrumbs
}

export interface NavChildItem {
  label: string
  path: string
  icon: string
  breadcrumbs: NavBreadcrumbs
  /** When true, route stays registered but the link is not shown in the sidebar. */
  hiddenInSidebar?: boolean
}

export function getSidebarVisibleNavChildren(children: NavChildItem[]): NavChildItem[] {
  return children.filter((child) => !child.hiddenInSidebar)
}

export interface NavCollapsibleGroup {
  label: string
  icon: string
  children: NavChildItem[]
}

export const NAV_COLLAPSIBLE_GROUPS: NavCollapsibleGroup[] = [
  {
    label: 'Nuggets',
    icon: 'menu_book',
    children: [
      {
        label: '3 Mins Challenge',
        path: '/3-min-challenges',
        icon: 'timer',
        breadcrumbs: { parent: '3 Mins Challenge', current: 'Overview' },
      },
      {
        label: '10 Mins Concept',
        path: '/10-mins-concept',
        icon: 'schedule',
        breadcrumbs: { parent: '10 Mins Concept', current: 'Overview' },
      },
      {
        label: 'Clinical Vignettes',
        path: '/clinical-vignettes',
        icon: 'clinical_notes',
        breadcrumbs: { parent: 'Clinical Vignettes', current: 'Overview' },
      },
    ],
  },
  {
    label: 'Videos',
    icon: 'video_library',
    children: [
      {
        label: 'Video Subjects',
        path: '/video-chapters',
        icon: 'topic',
        breadcrumbs: { parent: 'Video Subjects', current: 'Overview' },
      },
      {
        label: 'Videos',
        path: '/videos',
        icon: 'smart_display',
        breadcrumbs: { parent: 'Videos', current: 'Overview' },
      },
      {
        label: 'Generate Thumbnail',
        path: '/generate-thumbnail',
        icon: 'auto_awesome',
        breadcrumbs: { parent: 'Generate Thumbnail', current: 'Overview' },
        hiddenInSidebar: true,
      },
    ],
  },
  {
    label: 'QBanks',
    icon: 'quiz',
    children: [
      {
        label: 'Qbank Subjects',
        path: '/qbank-subjects',
        icon: 'category',
        breadcrumbs: { parent: 'Qbank Subjects', current: 'Overview' },
      },
      {
        label: 'QBanks',
        path: '/qbanks',
        icon: 'library_books',
        breadcrumbs: { parent: 'QBanks', current: 'Overview' },
      },
    ],
  },
]

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
    label: 'MCQ of the Day',
    path: '/mcq-of-the-day',
    icon: 'today',
    breadcrumbs: { parent: 'MCQ of the Day', current: 'Overview' },
  },
]

function findNavChildByPath(pathname: string): NavChildItem | undefined {
  for (const group of NAV_COLLAPSIBLE_GROUPS) {
    const child = group.children.find((item) => item.path === pathname)
    if (child) return child
  }
  return undefined
}

export function getBreadcrumbs(pathname: string): NavBreadcrumbs {
  const item = NAV_ITEMS.find((navItem) => navItem.path === pathname)
  if (item) return item.breadcrumbs

  const child = findNavChildByPath(pathname)
  if (child) return child.breadcrumbs

  return { parent: 'Dashboard', current: 'Overview' }
}

export function getNavItemByPath(
  pathname: string,
): Pick<NavItem, 'path' | 'label'> | undefined {
  const item = NAV_ITEMS.find((navItem) => navItem.path === pathname)
  if (item) return item

  const child = findNavChildByPath(pathname)
  if (child) return { path: child.path, label: child.label }

  return undefined
}
