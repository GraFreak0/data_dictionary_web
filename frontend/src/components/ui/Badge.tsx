import React from 'react'
import { cn } from '../../utils/cn'

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'admin'
  | 'contributor'
  | 'viewer'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  contributor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  admin: 'bg-purple-500',
  contributor: 'bg-blue-500',
  viewer: 'bg-slate-400',
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {dot && (
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const variant = role as BadgeVariant
  return (
    <Badge variant={['admin', 'contributor', 'viewer'].includes(role) ? variant : 'default'}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  )
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'success' : 'danger'} dot>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, BadgeVariant> = {
    schema: 'info',
    table: 'primary',
    column: 'success',
  }
  return <Badge variant={map[type] ?? 'default'}>{type}</Badge>
}
