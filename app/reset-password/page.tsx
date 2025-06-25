'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AUTH_SERVICE_URL } from '@/lib/api'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If token or email missing, redirect to forgot password page
  useEffect(() => {
    if (!token || !email) {
      router.replace('/forgot-password')
    }
  }, [token, email, router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken: token, newPassword }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Unable to reset password')
      }
      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 px-4 py-10">
        <div aria-hidden className="pointer-events-none select-none absolute -top-36 left-1/2 w-[72rem] h-[72rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-300 via-purple-300 to-pink-300 opacity-20 blur-3xl" />
        <div aria-hidden className="pointer-events-none select-none absolute -bottom-24 -left-24 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-fuchsia-400 via-rose-300 to-orange-300 opacity-30 blur-3xl" />

        <Card className="w-full max-w-md text-center p-8 space-y-4 backdrop-blur-md bg-white/80 dark:bg-neutral-800/70 border-transparent shadow-xl">
          <CardTitle className="text-center text-3xl font-bold">Password reset successfully</CardTitle>
          <p className="text-muted-foreground">You can now log in with your new password.</p>
          <Button onClick={() => router.replace('/login')}>Back to login</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 px-4 py-10">
      <div aria-hidden className="pointer-events-none select-none absolute -top-36 left-1/2 w-[72rem] h-[72rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-300 via-purple-300 to-pink-300 opacity-20 blur-3xl" />
      <div aria-hidden className="pointer-events-none select-none absolute -bottom-24 -left-24 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-fuchsia-400 via-rose-300 to-orange-300 opacity-30 blur-3xl" />

      <Card className="w-full max-w-md backdrop-blur-md bg-white/80 dark:bg-neutral-800/70 border-transparent shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-extrabold">Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </Button>
            <Link href='/login' className='block text-center text-sm text-muted-foreground hover:underline'>Back to login</Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 