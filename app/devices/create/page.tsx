'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEVICE_SERVICE_URL } from '@/lib/api'
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

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'BROKEN', 'DISCONTINUED']

export default function CreateDevicePage () {
  const router = useRouter()
  const role = getCurrentUserRole()
  const [form, setForm] = useState({
    name: '',
    model: '',
    serialNumber: '',
    warrantyExpiry: '',
    quantity: '',
    price: '',
    unit: '',
    status: 'ACTIVE'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (role && role !== 'STAFF') {
      router.replace('/dashboard')
    }
  }, [role])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let newValue = value
    if (name === 'quantity') {
      newValue = value.replace(/[^0-9]/g, '')
    } else if (name === 'price') {
      newValue = value.replace(/[^0-9.]/g, '')
    }
    // @ts-ignore dynamic key
    setForm(prev => ({ ...prev, [name]: newValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        name: form.name,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        quantity: form.quantity ? parseInt(form.quantity, 10) : undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        unit: form.unit || undefined,
        status: form.status || undefined
      }
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
      })
      const json: ApiResponse<unknown> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to create device')
      setSuccess('Device created successfully')
      setTimeout(() => router.push('/devices'), 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' onClick={() => router.back()}>&larr; Back</Button>
        <h1 className='text-2xl font-semibold'>Add New Device to Inventory</h1>
      </div>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <Label htmlFor='name'>Name</Label>
          <Input id='name' name='name' required value={form.name} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='model'>Model</Label>
          <Input id='model' name='model' value={form.model} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='serialNumber'>Serial Number</Label>
          <Input id='serialNumber' name='serialNumber' value={form.serialNumber} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='warrantyExpiry'>Warranty Expiry</Label>
          <Input id='warrantyExpiry' name='warrantyExpiry' type='date' value={form.warrantyExpiry} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='quantity'>Quantity</Label>
          <Input id='quantity' name='quantity' type='number' min='0' value={form.quantity} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='price'>Price</Label>
          <Input id='price' name='price' type='number' step='0.01' min='0' value={form.price} onChange={handleChange} placeholder='0.00' />
        </div>
        <div>
          <Label htmlFor='unit'>Unit</Label>
          <Input id='unit' name='unit' value={form.unit} onChange={handleChange} placeholder='Unit' />
        </div>
        <div>
          <Label htmlFor='status'>Status</Label>
          <select id='status' name='status' value={form.status} onChange={handleChange} className='border rounded-md h-10 px-3'>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {error && <p className='text-destructive text-sm'>{error}</p>}
        {success && <p className='text-green-600 text-sm'>{success}</p>}
        <Button type='submit' disabled={loading}>{loading ? 'Creating…' : 'Create Device'}</Button>
      </form>
    </div>
  )
} 