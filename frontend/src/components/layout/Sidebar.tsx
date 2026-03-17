import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Database,
  LayoutDashboard,
  Users,
  UserCircle,
  Shield,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  BookOpen,
  BarChart2,
  FolderOpen,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { getInitials } from '../../utils/format'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/schemas', icon: <Database size={18} />, label: 'Schema Browser' },
  { to: '/analytics', icon: <BarChart2 size={18} />, label: 'Analytics' },
  { to: '/profile', icon: <UserCircle size={18} />, label: 'Profile' },
  { to: '/admin', icon: <Shield size={18} />, label: 'Admin', adminOnly: true },
  { to: '/groups', icon: <Users size={18} />, label: 'Groups', adminOnly: true },
  { to: '/files', icon: <FolderOpen size={18} />, label: 'Files', adminOnly: true },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/signin')
      toast.success('Logged out successfully')
    } catch {
      navigate('/signin')
    }
  }

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <aside className="flex h-full flex-col" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 shadow-lg">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Data Dictionary</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Enterprise
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Navigation
        </p>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn('sidebar-link group', isActive && 'active')
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <ChevronRight
              size={14}
              className="opacity-0 group-hover:opacity-60 transition-opacity"
            />
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/5 p-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-link w-full hover:!text-red-400"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>

        {/* User info */}
        {user && (
          <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 border border-white/5 bg-white/5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {getInitials(user.username)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{user.username}</p>
              <p className="truncate text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
