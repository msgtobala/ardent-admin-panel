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
        label: 'Edit Module',
        path: '/edit-modules',
        icon: 'view_module',
        breadcrumbs: { parent: 'Edit Module', current: 'Overview' },
      },
      {
        label: 'Videos',
        path: '/videos',
        icon: 'smart_display',
        breadcrumbs: { parent: 'Videos', current: 'Overview' },
      },
      {
        label: 'Generate Thumbnails',
        path: '/generate-thumbnail',
        icon: 'auto_awesome',
        breadcrumbs: { parent: 'Generate Thumbnails', current: 'Overview' },
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
        label: 'Qbank Chapters',
        path: '/qbank-chapters',
        icon: 'article',
        breadcrumbs: { parent: 'QBanks', current: 'Chapters' },
      },
      {
        label: 'Qbank Questions',
        path: '/qbank-questions',
        icon: 'help',
        breadcrumbs: { parent: 'QBanks', current: 'Questions' },
      },
    ],
  },
  {
    label: 'Grand Tests',
    icon: 'assignment',
    children: [
      {
        label: 'Active Tests',
        path: '/grand-tests/active',
        icon: 'play_circle',
        breadcrumbs: { parent: 'Active Tests', current: 'Overview' },
      },
      {
        label: 'Completed Tests',
        path: '/grand-tests/completed',
        icon: 'task_alt',
        breadcrumbs: { parent: 'Completed Tests', current: 'Overview' },
      },
      {
        label: 'Add New Test',
        path: '/grand-tests/new',
        icon: 'add',
        breadcrumbs: { parent: 'Add New Test', current: 'Create' },
        hiddenInSidebar: true,
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
    label: 'User Queries',
    path: '/user-queries',
    icon: 'support_agent',
    breadcrumbs: { parent: 'User Queries', current: 'Overview' },
  },
  {
    label: 'MCQ of the Day',
    path: '/mcq-of-the-day',
    icon: 'today',
    breadcrumbs: { parent: 'MCQ of the Day', current: 'Overview' },
  },
  {
    label: 'Suggested Videos',
    path: '/suggested-videos',
    icon: 'thumb_up',
    breadcrumbs: { parent: 'Suggested Videos', current: 'Overview' },
  },
]

const GRAND_TEST_EDIT_PATH_PATTERN = /^\/grand-tests\/[^/]+\/edit$/

function findNavChildByPath(pathname: string): NavChildItem | undefined {
  for (const group of NAV_COLLAPSIBLE_GROUPS) {
    const child = group.children.find((item) => item.path === pathname)
    if (child) return child
  }
  return undefined
}

function getDynamicRouteBreadcrumbs(pathname: string): NavBreadcrumbs | undefined {
  if (GRAND_TEST_EDIT_PATH_PATTERN.test(pathname)) {
    return { parent: 'Active Tests', current: 'Edit Test' }
  }

  return undefined
}

export function getBreadcrumbs(pathname: string): NavBreadcrumbs {
  const item = NAV_ITEMS.find((navItem) => navItem.path === pathname)
  if (item) return item.breadcrumbs

  const child = findNavChildByPath(pathname)
  if (child) return child.breadcrumbs

  const dynamicBreadcrumbs = getDynamicRouteBreadcrumbs(pathname)
  if (dynamicBreadcrumbs) return dynamicBreadcrumbs

  return { parent: 'Dashboard', current: 'Overview' }
}

export function getNavItemByPath(
  pathname: string,
): Pick<NavItem, 'path' | 'label'> | undefined {
  const item = NAV_ITEMS.find((navItem) => navItem.path === pathname)
  if (item) return item

  const child = findNavChildByPath(pathname)
  if (child) return { path: child.path, label: child.label }

  if (GRAND_TEST_EDIT_PATH_PATTERN.test(pathname)) {
    return { path: '/grand-tests/active', label: 'Active Tests' }
  }

  return undefined
}
