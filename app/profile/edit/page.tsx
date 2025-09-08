'use client'

import { useState } from 'react'
import { AUTH_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout, getCurrentUser  } from '@/lib/auth'
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

interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string | null
}

export default function EditProfilePage () {
  const router = useRouter()
  const current = getCurrentUser()
  const [form, setForm] = useState({
    firstName: current?.firstName || '',
    lastName: current?.lastName || '',
    phone: current?.phone || ''
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
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getValidAccessToken()}`
        },
        body: JSON.stringify(form)
      })
      const json: ApiResponse<UserProfile> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to update profile')
      // persist updated user locally for header/sidebar etc.
      const storage = localStorage.getItem('currentUser') !== null ? localStorage : sessionStorage
      storage.setItem('currentUser', JSON.stringify(json.data))
      setSuccess('Profile updated successfully')
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
        <h1 className='text-2xl font-semibold'>Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <Label htmlFor='firstName'>First Name</Label>
          <Input id='firstName' name='firstName' value={form.firstName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor='lastName'>Last Name</Label>
          <Input id='lastName' name='lastName' value={form.lastName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor='phone'>Phone</Label>
          <Input id='phone' name='phone' value={form.phone ?? ''} onChange={handleChange} placeholder='+1234567890' />
        </div>
        {error && <p className='text-destructive text-sm'>{error}</p>}
        {success && <p className='text-green-600 text-sm'>{success}</p>}
        <Button type='submit' disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
      </form>
    </div>
  )
} 