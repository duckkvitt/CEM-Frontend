'use client'

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  tags: string[]
  isHidden: boolean
  createdAt?: string
  createdBy?: string
  updatedAt?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

export default function CustomerDetailPage () {
  const params = useParams()
  const id = (params?.id ?? '') as string
  const router = useRouter()
  const role = getCurrentUserRole()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Role guard
  useEffect(() => {
    if (role && !['STAFF', 'MANAGER', 'SUPPORT_TEAM'].includes(role)) {
      router.replace('/dashboard')
    }
  }, [role])

  // Fetch details
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers/${id}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          cache: 'no-store'
        })
        const json: ApiResponse<Customer> = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to fetch')
        setCustomer(json.data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unexpected error')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchCustomer()
  }, [id])

  if (loading) return <p className='p-6'>Loading…</p>
  if (error) return <p className='p-6 text-destructive'>{error}</p>
  if (!customer) return <p className='p-6'>Not found</p>

  return (
    <div className='flex min-h-screen w-full'>
      <Sidebar />
      <main className='ml-60 flex-1 bg-background p-6'>
        <div className='flex items-center gap-4 mb-6'>
          <Button variant='ghost' onClick={() => router.back()}>&larr; Back</Button>
          <h1 className='text-2xl font-semibold'>Customer Details</h1>
        </div>
        <div className='space-y-2'>
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
          {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
          <p><strong>Tags:</strong> {customer.tags?.length ? customer.tags.join(', ') : '-'}</p>
          <p><strong>Status:</strong> {customer.isHidden ? 'HIDDEN' : 'VISIBLE'}</p>
          {customer.createdBy && <p><strong>Created By:</strong> {customer.createdBy}</p>}
          {customer.createdAt && <p><strong>Created At:</strong> {new Date(customer.createdAt).toLocaleString()}</p>}
          {customer.updatedAt && <p><strong>Updated At:</strong> {new Date(customer.updatedAt).toLocaleString()}</p>}
        </div>
      </main>
    </div>
  )
}
