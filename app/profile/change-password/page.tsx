'use client'

import { useState } from 'react'
import { AUTH_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

export default function ChangePasswordPage () {
  const router = useRouter()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      }
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getValidAccessToken()}`
        },
        body: JSON.stringify(payload)
      })
      const json: ApiResponse<unknown> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to change password')
      setSuccess('Password changed successfully')
      setTimeout(() => router.push('/profile'), 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='max-w-lg mx-auto'>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' onClick={() => router.back()}>&larr; Back</Button>
        <h1 className='text-2xl font-semibold'>Change Password</h1>
      </div>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <Label htmlFor='currentPassword'>Current Password</Label>
          <Input id='currentPassword' name='currentPassword' type='password' required value={form.currentPassword} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='newPassword'>New Password</Label>
          <Input id='newPassword' name='newPassword' type='password' required value={form.newPassword} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='confirmPassword'>Confirm New Password</Label>
          <Input id='confirmPassword' name='confirmPassword' type='password' required value={form.confirmPassword} onChange={handleChange} />
        </div>
        {error && <p className='text-destructive text-sm'>{error}</p>}
        {success && <p className='text-green-600 text-sm'>{success}</p>}
        <Button type='submit' disabled={saving}>{saving ? 'Changing…' : 'Change Password'}</Button>
      </form>
    </div>
  )
} 