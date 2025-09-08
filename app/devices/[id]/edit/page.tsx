'use client'

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEVICE_SERVICE_URL, CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout, getCurrentUserRole  } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Device {
  id: number
  name: string
  model?: string
  serialNumber?: string
  warrantyExpiry?: string
  quantity?: number | string
  price?: number | string
  unit?: string
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

  const fetchDevice = async () => {
    if (!deviceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${await getValidAccessToken()}` },
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
    let newValue: string | number = value
    if (name === 'quantity') {
      newValue = Number(value)
    } else if (name === 'price') {
      newValue = value ? Number(value) : value
    }
    setDevice({ ...device, [name]: newValue })
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
        warrantyExpiry: device.warrantyExpiry || undefined,
        quantity: device.quantity ? Number(device.quantity) : undefined,
        price: device.price ? Number(device.price) : undefined,
        unit: device.unit || undefined,
        status: device.status || undefined
      }
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getValidAccessToken()}`
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
      <div className='flex items-center justify-center min-h-[60vh]'>
        {loading ? 'Loading…' : error || 'Device not found'}
      </div>
    )
  }

  return (
    <div>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' onClick={() => router.back()}>&larr; Back</Button>
        <h1 className='text-2xl font-semibold'>Edit Inventory Device</h1>
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
          <Label htmlFor='warrantyExpiry'>Warranty Expiry</Label>
          <Input id='warrantyExpiry' name='warrantyExpiry' type='date' value={device.warrantyExpiry ?? ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='quantity'>Quantity</Label>
          <Input id='quantity' name='quantity' type='number' min='0' value={device.quantity ?? ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor='price'>Price</Label>
          <Input id='price' name='price' type='number' step='0.01' min='0' value={device.price ?? ''} onChange={handleChange} placeholder='0.00' />
        </div>
        <div>
          <Label htmlFor='unit'>Unit</Label>
          <Input id='unit' name='unit' value={device.unit || ''} onChange={handleChange} placeholder='xe, cái, chiếc...' />
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
    </div>
  )
} 