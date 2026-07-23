import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Building2,
  Brain,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume', icon: FileText, label: 'Resume Analyzer' },
  { to: '/company-match', icon: Building2, label: 'Company Match' },
  { to: '/interview', icon: Brain, label: 'Mock Interview' },
  { to: '/profile', icon: User, label: 'Profile' },
]

function UserAvatar({ name, size = 'md' }: { name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CP'
  const sizeClass = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size]
  return (
    <div
      className={clsx(
        sizeClass,
        'rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center font-semibold text-white flex-shrink-0'
      )}
    >
      {initials}
    </div>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const { user } = useAuthStore()
  const logout = useLogout()

  const toggleTheme = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('light')
    document.documentElement.classList.toggle('dark')
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={clsx(
        'flex flex-col h-full',
        mobile
          ? 'w-72 bg-dark-surface border-r border-dark-border'
          : 'w-64 bg-dark-surface border-r border-dark-border'
      )}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-dark-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">CareerPilot</p>
            <p className="text-[10px] text-primary-400 font-medium tracking-wider uppercase">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-dark-muted uppercase tracking-widest">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx('nav-link group', isActive && 'active')}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle + user */}
      <div className="px-3 py-4 border-t border-dark-border space-y-2">
        <button
          onClick={toggleTheme}
          id="theme-toggle"
          className="nav-link w-full"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={logout}
          id="logout-btn"
          className="nav-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-card/60 border border-dark-border/40 mt-2">
          <UserAvatar name={user?.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.full_name ?? 'User'}</p>
            <p className="text-[10px] text-dark-muted truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 animate-slide-in-right">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            id="mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-dark-muted hover:text-white hover:bg-dark-card transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
              <Sparkles className="w-3 h-3 text-primary-400" />
              <span className="text-xs text-primary-300 font-medium">AI Powered</span>
            </div>
            <UserAvatar name={user?.full_name} size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
