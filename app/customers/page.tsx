'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  tags: string[]
  isHidden: boolean
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

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()

  // Load role on client after first render to avoid hydration mismatch
  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  // Redirect unauthorized roles
  useEffect(() => {
    if (role && !['STAFF', 'MANAGER', 'SUPPORT_TEAM'].includes(role)) {
      router.replace('/dashboard')
    }
  }, [role])

  const fetchCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.append('name', search)
      params.append('page', page.toString())
      params.append('size', size.toString())
      const url = `${CUSTOMER_SERVICE_URL}/v1/customers?${params.toString()}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        cache: 'no-store',
      })
      const json: ApiResponse<Page<Customer>> = await res.json()
      if (!json.success)
        throw new Error(json.message || 'Failed to fetch customers')
      setCustomers(json.data.content)
      setTotalPages(json.data.totalPages)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchCustomers()
  }

  const hideCustomer = async (id: number, hide: boolean) => {
    const confirmMsg = hide ? 'hide' : 'restore'
    if (!confirm(`Are you sure you want to ${confirmMsg} this customer?`))
      return
    try {
      const endpoint = `${CUSTOMER_SERVICE_URL}/v1/customers/${id}/${
        hide ? 'hide' : 'show'
      }`
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      })
      const json: ApiResponse<Customer> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      fetchCustomers()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Customer Management</h1>
        {role === 'STAFF' && (
          <Link href="/customers/create">
            <Button>Add Customer</Button>
          </Link>
        )}
      </div>
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-4 mb-6 items-end"
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name"
          />
        </div>
        <Button type="submit">Filter</Button>
      </form>
      {error && <p className="text-destructive mb-4">{error}</p>}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Tags</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2">{c.id}</td>
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">
                    {c.tags?.length ? c.tags.join(', ') : '-'}
                  </td>
                  <td className="px-4 py-2">
                    {c.isHidden ? 'HIDDEN' : 'VISIBLE'}
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <Link
                      href={`/customers/${c.id}`}
                      className="underline text-xs"
                    >
                      Details
                    </Link>
                    {role === 'STAFF' && (
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="underline text-xs"
                      >
                        Edit
                      </Link>
                    )}
                    {role === 'MANAGER' && (
                      <button
                        onClick={() => hideCustomer(c.id, !c.isHidden)}
                        className="underline text-xs text-red-600"
                      >
                        {c.isHidden ? 'Restore' : 'Hide'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}