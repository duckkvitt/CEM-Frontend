'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEVICE_SERVICE_URL, CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Device {
  id: number
  name: string
  model?: string
  serialNumber?: string
  // customerId không còn cần thiết ở đây vì đây là trang quản lý kho
  warrantyExpiry?: string
  quantity?: number
  status: string
  createdAt?: string
  updatedAt?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

const STATUS_OPTIONS = ['', 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'BROKEN', 'DISCONTINUED']

export default function DeviceManagementPage () {
  const [devices, setDevices] = useState<Device[]>([])
  const [search, setSearch] = useState('')
  // Xóa state của customer
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && !['STAFF', 'MANAGER', 'SUPPORT_TEAM', 'TECH_LEAD', 'TECHNICIAN'].includes(role)) {
      router.replace('/dashboard')
    }
  }, [role])

  // Xóa useEffect loadCustomers

  const fetchDevices = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) {
        params.append('keyword', search)
      }
      // Thêm param để chỉ lấy device trong kho
      params.append('inStock', 'true')
      if (status) params.append('status', status)
      params.append('page', page.toString())
      params.append('size', size.toString())
      const url = `${DEVICE_SERVICE_URL}/devices?${params.toString()}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        cache: 'no-store'
      })
      const json: ApiResponse<Page<Device>> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to fetch devices')
      setDevices(json.data.content)
      setTotalPages(json.data.totalPages)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchDevices()
  }

  const deleteDevice = async (id: number) => {
    if (!confirm('Are you sure you want to delete this device?')) return
    try {
      const endpoint = `${DEVICE_SERVICE_URL}/devices/${id}`
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      })
      const json: ApiResponse<string> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      fetchDevices()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  // Sửa layout wrapper, bỏ Sidebar và các class không cần thiết
  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-semibold'>Device Inventory Management</h1>
        {role === 'STAFF' && (
          <Link href='/devices/create'>
            <Button>Add New Device</Button>
          </Link>
        )}
      </div>
      <form onSubmit={handleFilter} className='flex flex-wrap gap-4 mb-6 items-end'>
        <div className='flex flex-col gap-1'>
          <Label htmlFor='search'>Search</Label>
          <Input id='search' value={search} onChange={e => setSearch(e.target.value)} placeholder='Name, model or serial' />
        </div>
        {/* Xóa bộ lọc customer */}
        <div className='flex flex-col gap-1'>
          <Label htmlFor='status'>Status</Label>
          <select
            id='status'
            value={status}
            onChange={e => setStatus(e.target.value)}
            className='border rounded-md h-10 px-3'
          >
            <option value=''>All</option>
            {STATUS_OPTIONS.filter(opt => opt).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <Button type='submit'>Filter</Button>
      </form>
      {error && <p className='text-destructive mb-4'>{error}</p>}
      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50'>
            <tr>
              <th className='px-4 py-2 text-left'>ID</th>
              <th className='px-4 py-2 text-left'>Name</th>
              <th className='px-4 py-2 text-left'>Model</th>
              <th className='px-4 py-2 text-left'>Serial #</th>
              <th className='px-4 py-2 text-left'>Qty</th>
              <th className='px-4 py-2 text-left'>Status</th>
              <th className='px-4 py-2 text-left'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className='px-4 py-6 text-center'>Loading...</td></tr>
            ) : devices.length === 0 ? (
              <tr><td colSpan={6} className='px-4 py-6 text-center'>No devices found</td></tr>
            ) : devices.map(d => (
              <tr key={d.id} className='border-t'>
                <td className='px-4 py-2'>{d.id}</td>
                <td className='px-4 py-2'>{d.name}</td>
                <td className='px-4 py-2'>{d.model || '-'}</td>
                <td className='px-4 py-2'>{d.serialNumber || '-'}</td>
                <td className='px-4 py-2'>{d.quantity ?? '-'}</td>
                <td className='px-4 py-2'>{d.status}</td>
                <td className='px-4 py-2 flex gap-2'>
                  <Link href={`/devices/${d.id}`} className='underline text-xs'>Details</Link>
                  {role === 'STAFF' && (
                    <>
                      <Link href={`/devices/${d.id}/edit`} className='underline text-xs'>Edit</Link>
                      <button onClick={() => deleteDevice(d.id)} className='underline text-xs text-red-600'>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='flex items-center justify-between mt-4'>
        <span>Page {page + 1} of {totalPages}</span>
        <div className='flex gap-2'>
          <Button variant='outline' disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</Button>
          <Button variant='outline' disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
} 