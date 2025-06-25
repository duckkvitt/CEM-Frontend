'use client'

import { useEffect, useState } from 'react'
import { AUTH_SERVICE_URL } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

interface RoleResponse {
  id: number
  name: string
}

interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName?: string
  phone?: string | null
  role?: RoleResponse
  status?: string
  emailVerified?: boolean
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

export default function ProfilePage () {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/profile`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        cache: 'no-store'
      })
      const json: ApiResponse<UserProfile> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load profile')
      setProfile(json.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) return <p>Loading profile…</p>
  if (error) return <p className='text-destructive'>{error}</p>
  if (!profile) return null

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>My Profile</h1>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => router.push('/profile/edit')}>Edit Profile</Button>
          <Button variant='outline' onClick={() => router.push('/profile/change-password')}>Change Password</Button>
        </div>
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div>
          <h2 className='font-medium text-muted-foreground text-sm mb-1'>Full Name</h2>
          <p>{profile.fullName || `${profile.firstName} ${profile.lastName}`}</p>
        </div>
        <div>
          <h2 className='font-medium text-muted-foreground text-sm mb-1'>Email</h2>
          <p>{profile.email}</p>
        </div>
        <div>
          <h2 className='font-medium text-muted-foreground text-sm mb-1'>Phone</h2>
          <p>{profile.phone || '-'}</p>
        </div>
        <div>
          <h2 className='font-medium text-muted-foreground text-sm mb-1'>Role</h2>
          <p>{profile.role?.name}</p>
        </div>
        <div>
          <h2 className='font-medium text-muted-foreground text-sm mb-1'>Status</h2>
          <p>{profile.status}</p>
        </div>
        <div>
          <h2 className='font-medium text-muted-foreground text-sm mb-1'>Email Verified</h2>
          <p>{profile.emailVerified ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  )
} 