import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Menu, X, BookOpen } from 'lucide-react'

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)] relative">
      {/* Mobile Top Header (Visible only < md) */}
      <div className="md:hidden flex items-center justify-between bg-[#0f172a] border-b border-white/5 px-4 h-16 shrink-0 absolute top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-white" />
          <span className="text-white font-bold text-lg">Data Dictionary</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out bg-[#0f172a]
        md:relative md:translate-x-0
        flex md:w-20 lg:w-60 shrink-0 flex-col
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
      `}>
        <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden w-full relative pt-16 md:pt-0">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="min-h-full p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
