import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Eye, EyeOff, Mail, Lock, User, GraduationCap, Building, BookOpen, ArrowRight, Sparkles,
} from 'lucide-react'
import { registerSchema, type RegisterFormData } from '../../lib/validations/auth'
import { useRegister } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const currentYear = new Date().getFullYear()
const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Other']
const GRAD_YEARS = Array.from({ length: 7 }, (_, i) => currentYear + i - 1)

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strength = checks.filter(Boolean).length
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength - 1] : 'bg-dark-border'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : strength === 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
        Password strength: {labels[strength - 1] ?? 'Very weak'}
      </p>
    </div>
  )
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: register, isPending } = useRegister()

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch('password', '')

  const onSubmit = (data: RegisterFormData) => {
    const payload = {
      ...data,
      college: data.college || undefined,
      branch: data.branch || undefined,
      graduation_year: data.graduation_year || undefined,
    }
    register(payload)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-animated-gradient relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 mb-4 shadow-glow-primary">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-dark-muted text-sm">Start your AI-powered placement journey</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Full name + Email in a grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                {...formRegister('full_name')}
                id="register-full-name"
                label="Full Name"
                placeholder="John Doe"
                autoComplete="name"
                error={errors.full_name?.message}
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                {...formRegister('email')}
                id="register-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Input
                {...formRegister('password')}
                id="register-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                error={errors.password?.message}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-dark-muted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <PasswordStrengthBar password={passwordValue} />
            </div>

            <div className="border-t border-dark-border pt-4">
              <p className="text-xs text-dark-muted mb-4 font-medium uppercase tracking-wider">Academic Details (Optional)</p>
              <div className="space-y-4">
                <Input
                  {...formRegister('college')}
                  id="register-college"
                  label="College / University"
                  placeholder="e.g. IIT Bombay"
                  error={errors.college?.message}
                  leftIcon={<GraduationCap className="w-4 h-4" />}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="register-branch" className="text-sm font-medium text-slate-300">Branch</label>
                    <select
                      {...formRegister('branch')}
                      id="register-branch"
                      className="form-input"
                    >
                      <option value="">Select branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="register-grad-year" className="text-sm font-medium text-slate-300">Graduation Year</label>
                    <select
                      {...formRegister('graduation_year', { valueAsNumber: true })}
                      id="register-grad-year"
                      className="form-input"
                    >
                      <option value="">Select year</option>
                      {GRAD_YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              id="register-submit"
              size="lg"
              isLoading={isPending}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full mt-2"
            >
              {isPending ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                id="go-to-login"
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-dark-muted mt-6">
          By registering, you agree to our{' '}
          <span className="text-primary-400">Terms of Service</span>
        </p>
      </div>
    </div>
  )
}
