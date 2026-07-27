import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantClasses = {
  primary: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
  neutral: 'bg-dark-surface text-dark-muted border-dark-border',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs font-medium',
  lg: 'px-3 py-1 text-sm font-medium',
}

export default function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border',
        sizeClasses[size] || sizeClasses.md,
        variantClasses[variant] || variantClasses.neutral,
        className
      )}
    >
      {children}
    </span>
  )
}
