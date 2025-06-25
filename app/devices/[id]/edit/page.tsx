'use client'

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEVICE_SERVICE_URL, CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Device {
  id: number
  name: string
  model?: string
  serialNumber?: string
  customerId?: number
  warrantyExpiry?: string
  status: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'BROKEN', 'DISCONTINUED']

export default function EditDevicePage () {
  const router = useRouter()
  const params = useParams()
  const deviceId = params?.id as string | undefined
  const role = getCurrentUserRole()
  const [device, setDevice] = useState<Device | null>(null)
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Access control
  useEffect(() => {
    if (role && role !== 'STAFF') {
      router.replace('/dashboard')
    }
  }, [role])

  // load customers list once
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers?size=1000`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          cache: 'no-store'
        })
        const json = await res.json() as { success: boolean; data: { content: { id: number; name: string }[] } }
        if (json.success) setCustomers(json.data.content)
      } catch {}
    }
    loadCustomers()
  }, [])

  const fetchDevice = async () => {
    if (!deviceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        cache: 'no-store'
      })
      const json: ApiResponse<Device> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      setDevice(json.data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevice()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (!device) return
    setDevice({ ...device, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!device) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        name: device.name,
        model: device.model || undefined,
        serialNumber: device.serialNumber || undefined,
        customerId: device.customerId || undefined,
        warrantyExpiry: device.warrantyExpiry || undefined,
        status: device.status || undefined
      }
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
      })
      const json: ApiResponse<Device> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to update device')
      setSuccess('Device updated successfully')
      setTimeout(() => router.push(`/devices/${deviceId}`), 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !device) {
    return (
      <div className='flex min-h-screen w-full'>
        <Sidebar />
        <main className='ml-60 flex-1 bg-background p-6 flex items-center justify-center'>
          {loading ? 'Loading…' : error || 'Device not found'}
        </main>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen w-full'>
      <Sidebar />
      <main className='ml-60 flex-1 bg-background p-6 max-w-xl'>
        <div className='flex items-center gap-4 mb-6'>
          <Button variant='ghost' onClick={() => router.back()}>&larr; Back</Button>
          <h1 className='text-2xl font-semibold'>Edit Device</h1>
        </div>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Name</Label>
            <Input id='name' name='name' required value={device.name} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='model'>Model</Label>
            <Input id='model' name='model' value={device.model || ''} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='serialNumber'>Serial Number</Label>
            <Input id='serialNumber' name='serialNumber' value={device.serialNumber || ''} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='customerId'>Customer</Label>
            <select
              id='customerId'
              name='customerId'
              value={device.customerId ?? ''}
              onChange={handleChange}
              className='border rounded-md h-10 px-3 w-full'
            >
              <option value=''>-- Select customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor='warrantyExpiry'>Warranty Expiry</Label>
            <Input id='warrantyExpiry' name='warrantyExpiry' type='date' value={device.warrantyExpiry ?? ''} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor='status'>Status</Label>
            <select id='status' name='status' value={device.status} onChange={handleChange} className='border rounded-md h-10 px-3'>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {error && <p className='text-destructive text-sm'>{error}</p>}
          {success && <p className='text-green-600 text-sm'>{success}</p>}
          <Button type='submit' disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </form>
      </main>
    </div>
  )
} 