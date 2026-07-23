import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({ hoverable = false, padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        hoverable ? 'glass-card-hover' : 'glass-card',
        paddingClasses[padding],
        'animate-fade-in',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
