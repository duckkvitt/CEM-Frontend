'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PlusCircle,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Enhanced Customer Interface with new fields
interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string | null
  companyName: string | null
  companyTaxCode: string | null
  companyAddress: string | null
  legalRepresentative: string
  title: string
  identityNumber: string
  identityIssueDate: string // Assuming string from API
  identityIssuePlace: string
  fax: string | null
  tags: string[]
  isHidden: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// A more visually appealing loader
function CustomerTableSkeleton() {
  return (
    <div className="space-y-2 mt-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const router = useRouter()

  useEffect(() => {
    const userRole = getCurrentUserRole()
    setRole(userRole)
    if (userRole && !['STAFF', 'MANAGER', 'SUPPORT_TEAM'].includes(userRole)) {
      router.replace('/dashboard')
    }
  }, [router])

  const fetchCustomers = useMemo(
    () => async (page: number, size: number, name?: string) => {
      if (!role) return // Don't fetch if role is not determined yet
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (name) params.append('name', name)
        params.append('page', page.toString())
        params.append('size', size.toString())
        params.append('sortBy', 'createdAt')
        params.append('sortDir', 'desc')

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
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    },
    [role]
  )

  useEffect(() => {
    fetchCustomers(page, size)
  }, [page, size, fetchCustomers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchCustomers(0, size, searchTerm)
  }
  
  const hideCustomer = async (id: number, hide: boolean) => {
    const action = hide ? 'hide' : 'show';
    if (!confirm(`Are you sure you want to ${action} this customer?`)) return;

    try {
      const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      const json: ApiResponse<Customer> = await res.json();
      if (!json.success) throw new Error(json.message || `Failed to ${action} customer`);
      // Refresh data
      fetchCustomers(page, size, searchTerm);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (!role) {
    return <CustomerTableSkeleton /> // Or some other placeholder
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Customers</h1>
        <div className="ml-auto flex items-center gap-2">
          {role === 'STAFF' && (
            <Link href="/customers/create">
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Customer
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer Overview</CardTitle>
          <CardDescription>
            Browse and manage your company's customers.
          </CardDescription>
          <form onSubmit={handleSearch} className="flex gap-2 mt-4">
            <div className="relative flex-1 md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by customer name..."
                className="w-full appearance-none bg-background pl-8 shadow-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive mb-4">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">
                  Legal Rep.
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">
                  Created at
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={6}><CustomerTableSkeleton /></TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {customer.legalRepresentative}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isHidden ? 'outline' : 'secondary'}>
                        {customer.isHidden ? 'Hidden' : 'Visible'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {customer.phone}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/customers/${customer.id}`}>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </Link>
                           {role === 'STAFF' && (
                            <Link href={`/customers/${customer.id}/edit`}>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                            </Link>
                           )}
                          {role === 'MANAGER' && (
                            <DropdownMenuItem onSelect={() => hideCustomer(customer.id, !customer.isHidden)}>
                              {customer.isHidden ? 'Restore' : 'Hide'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
         <div className="flex items-center justify-between p-4">
            <div className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-2">Previous</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(p => p + 1)}
            >
                <span className="mr-2">Next</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
            </div>
        </div>
      </Card>
    </main>
  )
}