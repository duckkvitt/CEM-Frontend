'use client'

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AUTH_SERVICE_URL } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
  role: Role
  status: string
  emailVerified: boolean
  inactive?: boolean
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface Page<T> {
  content: T[]
  totalPages: number
  number: number
  size: number
}

export default function CustomerUserManagementPage () {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('page', page.toString())
      params.append('size', size.toString())
      const url = `${AUTH_SERVICE_URL}/v1/auth/admin/users?${params.toString()}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        cache: 'no-store'
      })
      const json: ApiResponse<Page<User>> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to fetch users')
      // Only show CUSTOMER users
      setUsers(json.data.content.filter(u => u.role?.name === 'CUSTOMER'))
      setTotalPages(json.data.totalPages)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const deactivateUser = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/admin/users/${id}/deactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      })
      const json: ApiResponse<User> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      // refresh list
      fetchUsers()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchUsers()
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Customer User Management</h1>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email" />
          </div>
          <Button type="submit">Filter</Button>
        </form>

        {error && <p className="text-destructive mb-4">{error}</p>}

        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Full Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center">No customer users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2">{u.fullName}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role?.name}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span>{u.status}</span>
                    {u.status !== 'INACTIVE' && (
                      <button onClick={() => deactivateUser(u.id)} className="text-xs text-red-600 underline">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
} 