'use client'

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

export default function CreateCustomerPage () {
  const router = useRouter()
  const role = getCurrentUserRole()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tags: '' // comma separated input
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (role && role !== 'STAFF') {
      router.replace('/dashboard')
    }
  }, [role])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      }
      const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
      })
      const json: ApiResponse<unknown> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to create customer')
      setSuccess('Customer created successfully')
      setTimeout(() => router.push('/customers'), 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen w-full'>
      <Sidebar />
      <main className='ml-60 flex-1 bg-background p-6 max-w-xl'>
        <div className='flex items-center gap-4 mb-6'>
          <Button variant='ghost' onClick={() => router.back()}>&larr; Back</Button>
          <h1 className='text-2xl font-semibold'>Create Customer</h1>
        </div>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Name</Label>
            <Input id='name' name='name' required value={form.name} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' name='email' type='email' required value={form.email} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='phone'>Phone</Label>
            <Input id='phone' name='phone' value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='address'>Address</Label>
            <Input id='address' name='address' value={form.address} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='tags'>Tags (comma separated)</Label>
            <Input id='tags' name='tags' value={form.tags} onChange={handleChange} />
          </div>
          {error && <p className='text-destructive text-sm'>{error}</p>}
          {success && <p className='text-green-600 text-sm'>{success}</p>}
          <Button type='submit' disabled={loading}>{loading ? 'Creating…' : 'Create Customer'}</Button>
        </form>
      </main>
    </div>
  )
} 