'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AUTH_SERVICE_URL } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:8081'}/auth/v1/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe: remember }),
        }
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Login failed')
      }
      const { accessToken, refreshToken, user } = json.data || {}
      if (!accessToken) {
        throw new Error('Token not received')
      }
      if (remember) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        if (user) localStorage.setItem('currentUser', JSON.stringify(user))
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('refreshToken', refreshToken)
        if (user) sessionStorage.setItem('currentUser', JSON.stringify(user))
      }
      router.replace('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 px-4 py-10">
      {/* decorative blobs */}
      <div aria-hidden className="pointer-events-none select-none absolute -top-36 left-1/2 w-[72rem] h-[72rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-300 via-purple-300 to-pink-300 opacity-20 blur-3xl" />
      <div aria-hidden className="pointer-events-none select-none absolute -bottom-24 -left-24 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-fuchsia-400 via-rose-300 to-orange-300 opacity-30 blur-3xl" />

      <Card className="w-full max-w-md backdrop-blur-md bg-white/80 dark:bg-neutral-800/70 border-transparent shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-extrabold text-foreground">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input focus:ring-2 focus:ring-ring"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Don&apos;t have an account? Please contact your administrator
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 