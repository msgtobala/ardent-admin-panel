import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

export function AppLayout() {
  return (
    <div className="flex h-svh overflow-hidden bg-app-bg">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="min-h-0 flex-1 overflow-y-auto p-gutter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
