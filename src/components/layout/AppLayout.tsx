import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

export function AppLayout() {
  return (
    <div className="flex min-h-svh bg-app-bg">
      <Sidebar />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-gutter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
