import { useAuthStore } from '../store/authStore'
import Card from '../components/ui/Card'
import { Mail, GraduationCap, Calendar, BookOpen } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">Profile Settings</h1>
      
      <Card>
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-glow-primary">
            {user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CP'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.full_name || 'User'}</h2>
            <p className="text-dark-muted flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-dark-border pb-2">Academic Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-dark-muted">College / University</p>
                  <p className="text-sm font-medium text-white">{user?.college || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-dark-muted">Branch</p>
                  <p className="text-sm font-medium text-white">{user?.branch || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-dark-muted">Graduation Year</p>
                  <p className="text-sm font-medium text-white">{user?.graduation_year || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
