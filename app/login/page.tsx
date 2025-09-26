'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AUTH_SERVICE_URL } from '@/lib/api'
import {
  ShieldCheck,
  User,
  MapPin,
  Phone,
  Barcode,
  Building,
  Activity,
  Calendar,
  Cog,
  Power,
  Eye,
  EyeOff,
} from 'lucide-react'

// Custom styling for a more mechanical/tech feel
const MechanicalInput = (props: React.ComponentProps<typeof Input>) => {
  return (
    <div className="relative">
      <Input
        className="bg-neutral-800/50 border-neutral-700/50 focus:border-cyan-400/80 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-0 focus-visible:ring-offset-neutral-900 transition-all duration-300 placeholder:text-neutral-500 pl-10"
        {...props}
      />
      {props.type === 'email' && (
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
      )}
      {props.type === 'password' && (
        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
      )}
    </div>
  )
}

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) => (
  <div className="flex items-center gap-4 text-sm font-mono text-neutral-400 animate-fade-in-up">
    <div className="text-cyan-400">{icon}</div>
    <p className="flex-1 border-b border-dashed border-neutral-700/50 pb-1">
      <span className="text-neutral-500">{label}:</span> {value}
    </p>
  </div>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe: remember }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Login failed')
      }
      const { accessToken, refreshToken, user } = json.data || {}
      if (!accessToken) {
        throw new Error('Token not received')
      }
      
      // Import the new storeTokens function
      const { storeTokens } = await import('@/lib/auth')
      
      // Store tokens based on remember preference
      storeTokens({
        accessToken,
        refreshToken,
        user
      }, remember)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-200 overflow-hidden relative font-sans">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 h-full w-full bg-transparent bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px]"></div>
      {/* Mouse Follow Spotlight */}
      {isClient && (
        <div className="pointer-events-none fixed inset-0 z-10 transition duration-300 lg:absolute bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,rgba(0,255,255,0)_50%)]"
          style={{
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'translate(-50%, -50%)',
            opacity: 0.3,
          }}
          ref={el => {
            if (!el) return;
            window.addEventListener('mousemove', e => {
              el.style.left = `${e.clientX}px`
              el.style.top = `${e.clientY}px`
            });
          }}
        />
      )}

      <main className="relative z-20 grid grid-cols-1 lg:grid-cols-2 items-center justify-center min-h-screen p-4 md:p-8">
        {/* Left Panel: Info Display */}
        <div className="hidden lg:flex flex-col gap-8 p-8 animate-slide-in-left">
          <div className="font-mono">
            <h1 className="text-5xl font-bold text-white tracking-widest leading-tight">
              THÀNH ĐẠT
            </h1>
            <p className="text-sm text-cyan-400 mt-2">
              CÔNG TY TNHH KINH DOANH XUẤT NHẬP KHẨU TM VÀ SX
            </p>
          </div>
          <div className="space-y-4 max-w-lg">
            <InfoRow
              icon={<Barcode size={20} />}
              label="Mã số thuế"
              value="0901108513"
            />
            <InfoRow
              icon={<MapPin size={20} />}
              label="Địa chỉ"
              value="Thôn Giữa, Xã Lạc Đạo, Huyện Văn Lâm, Tỉnh Hưng Yên"
            />
            <InfoRow
              icon={<User size={20} />}
              label="Người đại diện"
              value="NGUYỄN NGỌC LAN"
            />
            <InfoRow
              icon={<Phone size={20} />}
              label="Điện thoại"
              value="0948 566416"
            />
            <InfoRow
              icon={<Calendar size={20} />}
              label="Ngày hoạt động"
              value="2021-09-28"
            />
            <InfoRow
              icon={<Building size={20} />}
              label="Quản lý bởi"
              value="Huyện Văn Lâm - Đội Thuế liên huyện Mỹ Hào - Văn Lâm"
            />
            <InfoRow
              icon={<Activity size={20} />}
              label="Tình trạng"
              value="Đang hoạt động"
            />
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full max-w-md mx-auto animate-slide-in-right">
          <div className="relative border border-cyan-400/20 rounded-xl bg-neutral-900/60 backdrop-blur-sm shadow-2xl shadow-cyan-500/5">
            {/* Corner decorations */}
            <div className="absolute -top-px -left-px -right-px h-2 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent"></div>
            <div className="absolute -bottom-px -left-px -right-px h-2 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent"></div>

            <div className="p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">System Access</h2>
                <p className="text-neutral-400 text-sm mt-2">
                  Authenticate to access the control panel
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded-md p-3 text-center animate-shake">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="font-mono text-xs uppercase tracking-wider text-neutral-400"
                  >
                    Operator Email
                  </Label>
                  <MechanicalInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="font-mono text-xs uppercase tracking-wider text-neutral-400"
                  >
                    Access Code
                  </Label>
                   <div className="relative">
                    <MechanicalInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-cyan-400 transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 select-none font-mono text-neutral-400">
                    <input
                      type="checkbox"
                      className="h-4 w-4 appearance-none rounded-sm border border-neutral-600 bg-neutral-800 checked:bg-cyan-500 checked:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all duration-200"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                    />
                    <span>Remember Me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold text-lg bg-cyan-500/10 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(78,210,240,0.5)] transition-all duration-300 group relative"
                  disabled={loading}
                >
                  {loading ? (
                    <Cog className="animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Power />
                      Initiate Login
                    </span>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground font-mono">
                  Don&apos;t have an account? Please contact an administrator.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
