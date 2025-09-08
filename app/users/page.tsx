'use client'

import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AUTH_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout } from '@/lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  errors?: unknown
  status?: number
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export default function UserManagementPage () {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function for authenticated requests
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getValidAccessToken()
    if (!token) {
      await logout()
      router.push('/login')
      throw new Error('Authentication failed')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 401) {
      await logout()
      router.push('/login')
      throw new Error('Session expired')
    }

    return response
  }

  const fetchRoles = async () => {
    try {
      const res = await authenticatedFetch(`${AUTH_SERVICE_URL}/v1/auth/admin/roles`, {
        cache: 'no-store'
      })
      const json: ApiResponse<Role[]> = await res.json()
      if (json.success && json.data) setRoles(json.data)
    } catch (err) {
      // ignore
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (roleId) params.append('roleId', roleId)
      params.append('page', page.toString())
      params.append('size', size.toString())
      const url = `${AUTH_SERVICE_URL}/v1/auth/admin/users?${params.toString()}`
      const res = await authenticatedFetch(url, {
        cache: 'no-store'
      })
      const json: ApiResponse<Page<User>> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to fetch users')
      setUsers(json.data.content)
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
      const res = await authenticatedFetch(`${AUTH_SERVICE_URL}/v1/auth/admin/users/${id}/deactivate`, {
        method: 'PUT'
      })
      const json: ApiResponse<User> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      // refresh list
      fetchUsers()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const activateUser = async (id: number) => {
    if (!confirm('Are you sure you want to activate this user?')) return
    try {
      const res = await authenticatedFetch(`${AUTH_SERVICE_URL}/v1/auth/admin/users/${id}/activate`, {
        method: 'PUT'
      })
      const json: ApiResponse<User> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed')
      // refresh list
      fetchUsers()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const updateUserRole = async (userId: number, roleId: number) => {
    if (!confirm('Are you sure you want to change this user\'s role?')) return
    try {
      const res = await authenticatedFetch(`${AUTH_SERVICE_URL}/v1/auth/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roleId })
      })
      const json: ApiResponse<User> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to update user role')
      // refresh list
      fetchUsers()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchUsers()
  }

  // Filter roles to exclude ADMIN, SUPER_ADMIN, CUSTOMER, USER
  const filteredRoles = roles.filter(r => !['ADMIN', 'SUPER_ADMIN', 'CUSTOMER', 'USER'].includes(r.name))
  // Filter users to exclude ADMIN, SUPER_ADMIN, CUSTOMER, USER
  const filteredUsers = users.filter(u => !['ADMIN', 'SUPER_ADMIN', 'CUSTOMER', 'USER'].includes(u.role?.name))

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <Link href="/users/create">
            <Button>Add User</Button>
          </Link>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="role">Role</Label>
            <select id="role" value={roleId} onChange={e => setRoleId(e.target.value)} className="h-10 rounded-md border px-3 text-sm">
              <option value="">All</option>
              {filteredRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit">Filter</Button>
        </form>

        {error && <p className="text-destructive mb-4">{error}</p>}

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Full Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center">No users found</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2">{u.fullName}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    <Select 
                      value={u.role?.id.toString() || ''} 
                      onValueChange={(value) => updateUserRole(u.id, parseInt(value))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredRoles.map(role => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2">{u.status}</td>
                  <td className="px-4 py-2">
                    {u.status === 'INACTIVE' ? (
                      <button onClick={() => activateUser(u.id)} className="text-xs text-green-600 underline">Activate</button>
                    ) : (
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
            <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</Button>
            <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </main>
    </div>
  )
} 