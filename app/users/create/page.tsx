"use client"

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AUTH_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Role {
  id: number
  name: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: unknown
  status?: number
}

export default function CreateUserPage () {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    emailVerified: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({})

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/admin/roles`, {
          headers: { Authorization: `Bearer ${await getValidAccessToken()}` },
          cache: 'no-store'
        })
        const json: ApiResponse<Role[]> = await res.json()
        if (json.success && json.data) setRoles(json.data)
      } catch {
        // ignore
      }
    }
    fetchRoles()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement
    const isCheckbox = type === 'checkbox'
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value
    setForm(prev => ({
      ...prev,
      [name]: newValue
    }))
    // Clear field-specific error when user starts editing the field
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setFieldErrors({})
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getValidAccessToken()}`
        },
        body: JSON.stringify({
          ...form,
          roleId: form.roleId ? Number(form.roleId) : null
        })
      })
      const json: ApiResponse<unknown> = await res.json()
      if (!json.success) {
        // Prefer field-level errors if provided by backend
        if (json.errors && typeof json.errors === 'object' && json.errors !== null) {
          const errorsObj = json.errors as Record<string, string | string[]>
          setFieldErrors(errorsObj)
        }
        setError(json.message || 'Validation failed')
        return
      }
      setSuccess('User created successfully')
      setTimeout(() => {
        router.push('/users')
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background p-6 max-w-xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>&larr; Back</Button>
          <h1 className="text-2xl font-semibold">Create User</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
            {fieldErrors.email && (
              <p className="text-destructive text-xs mt-1">{Array.isArray(fieldErrors.email) ? fieldErrors.email.join(', ') : fieldErrors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" name="firstName" required value={form.firstName} onChange={handleChange} />
            {fieldErrors.firstName && (
              <p className="text-destructive text-xs mt-1">{Array.isArray(fieldErrors.firstName) ? fieldErrors.firstName.join(', ') : fieldErrors.firstName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" name="lastName" required value={form.lastName} onChange={handleChange} />
            {fieldErrors.lastName && (
              <p className="text-destructive text-xs mt-1">{Array.isArray(fieldErrors.lastName) ? fieldErrors.lastName.join(', ') : fieldErrors.lastName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            {fieldErrors.phone && (
              <p className="text-destructive text-xs mt-1">{Array.isArray(fieldErrors.phone) ? fieldErrors.phone.join(', ') : fieldErrors.phone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="roleId">Role</Label>
            <select id="roleId" name="roleId" required value={form.roleId} onChange={handleChange} className="h-10 rounded-md border px-3 text-sm w-full">
              <option value="">Select role</option>
              {roles
                .filter(r => !['USER', 'ADMIN'].includes(r.name.toUpperCase()))
                .map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {fieldErrors.roleId && (
              <p className="text-destructive text-xs mt-1">{Array.isArray(fieldErrors.roleId) ? fieldErrors.roleId.join(', ') : fieldErrors.roleId}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input id="emailVerified" name="emailVerified" type="checkbox" checked={form.emailVerified} onChange={handleChange} />
            <Label htmlFor="emailVerified">Email Verified</Label>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create User'}</Button>
        </form>
      </main>
    </div>
  )
} 