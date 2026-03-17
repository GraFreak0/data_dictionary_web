import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
      {/* Sidebar - fixed width */}
      <div className="hidden md:flex md:w-60 md:shrink-0 md:flex-col">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
