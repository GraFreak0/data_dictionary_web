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

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      if (onCloseMobile) onCloseMobile();
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
    <aside className="flex h-full flex-col w-full" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 md:justify-center lg:justify-start">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 shadow-lg" title="Data Dictionary">
          <BookOpen size={20} className="text-white" />
        </div>
        <div className="block md:hidden lg:block overflow-hidden">
          <h1 className="text-sm font-bold text-white leading-tight whitespace-nowrap">Data Dictionary</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Enterprise
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 md:hidden lg:block">
          Navigation
        </p>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            title={item.label}
            className={({ isActive }) =>
              cn('sidebar-link group flex items-center md:justify-center lg:justify-start', isActive && 'active')
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1 ml-3 block md:hidden lg:block whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
            <ChevronRight
              size={14}
              className="opacity-0 group-hover:opacity-60 transition-opacity hidden lg:block"
            />
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/5 p-3 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full flex items-center md:justify-center lg:justify-start"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="shrink-0">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</span>
          <span className="ml-3 block md:hidden lg:block whitespace-nowrap">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-link w-full hover:!text-red-400 flex items-center md:justify-center lg:justify-start"
          title="Sign Out"
        >
          <span className="shrink-0"><LogOut size={18} /></span>
          <span className="ml-3 block md:hidden lg:block whitespace-nowrap">Sign Out</span>
        </button>

        {/* User info */}
        {user && (
          <div className="mt-2 flex items-center gap-3 rounded-lg px-2 lg:px-3 py-3 border border-white/5 bg-white/5 md:justify-center lg:justify-start overflow-hidden" title={user.username}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {getInitials(user.username)}
            </div>
            <div className="min-w-0 flex-1 block md:hidden lg:block">
              <p className="truncate text-sm font-medium text-slate-200">{user.username}</p>
              <p className="truncate text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
