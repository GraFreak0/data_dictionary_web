import React from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className, hover, onClick, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]',
        paddingClasses[padding],
        hover && 'cursor-pointer transition-all hover:border-primary-300 hover:shadow-elevated dark:hover:border-primary-700',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconColor?: string
  description?: string
  trend?: { value: number; label: string }
}

export function StatCard({ label, value, icon, iconColor, description, trend }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)] tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
          )}
          {trend && (
            <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trend.value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
              <span className="text-[var(--text-muted)]">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            iconColor ?? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
