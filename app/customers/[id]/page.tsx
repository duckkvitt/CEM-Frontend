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
import { Skeleton } from '@/components/ui/skeleton'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { ChevronLeft, User, Building, Info, Calendar, Key, Hash, Phone, Mail, FileText } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Updated Customer interface
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
  identityIssueDate: string
  identityIssuePlace: string
  fax: string | null
  tags: string[]
  isHidden: boolean
  createdBy: string
  createdAt: string
  updatedAt:string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) {
    if (!value) return null
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-1" />
            <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
            </div>
        </div>
    )
}

function SkeletonLoader() {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
       <Skeleton className="h-8 w-48" />
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
       </div>
    </div>
  )
}

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = getCurrentUserRole()
    if (role && !['STAFF', 'MANAGER', 'SUPPORT_TEAM'].includes(role)) {
      router.replace('/dashboard')
    }
  }, [router])

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers/${id}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`Server responded with ${res.status}`)
        const json: ApiResponse<Customer> = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to fetch customer data')
        setCustomer(json.data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchCustomer()
  }, [id])

  if (loading) return <SkeletonLoader />
  if (error) return <p className="p-6 text-destructive">Error: {error}</p>
  if (!customer) return <p className="p-6">Customer not found.</p>

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Customer Details</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{customer.legalRepresentative}</CardTitle>
             <User className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailItem icon={Key} label="Title" value={customer.title} />
            <DetailItem icon={Mail} label="Email" value={customer.email} />
            <DetailItem icon={Phone} label="Phone" value={customer.phone} />
            <DetailItem icon={Info} label="Identity No." value={customer.identityNumber} />
            <DetailItem icon={Calendar} label="Issue Date" value={new Date(customer.identityIssueDate).toLocaleDateString()} />
             <DetailItem icon={FileText} label="Issue Place" value={customer.identityIssuePlace} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{customer.companyName || 'Company Information'}</CardTitle>
            <Building className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
           <CardContent className="space-y-4">
             <DetailItem icon={Hash} label="Customer Name" value={customer.name} />
            <DetailItem icon={Hash} label="Tax Code" value={customer.companyTaxCode} />
            <DetailItem icon={Info} label="Company Address" value={customer.companyAddress} />
            <DetailItem icon={Phone} label="Fax" value={customer.fax} />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DetailItem icon={Info} label="Status" value={<Badge variant={customer.isHidden ? 'outline' : 'secondary'}> {customer.isHidden ? 'Hidden' : 'Active'} </Badge>} />
                <DetailItem icon={User} label="Created By" value={customer.createdBy} />
                <DetailItem icon={Calendar} label="Created At" value={new Date(customer.createdAt).toLocaleString()} />
                <DetailItem icon={Calendar} label="Last Updated" value={new Date(customer.updatedAt).toLocaleString()} />
                <DetailItem icon={Hash} label="Tags" value={customer.tags?.length > 0 ? customer.tags.join(', ') : 'N/A'} />
            </CardContent>
        </Card>
      </div>
    </main>
  )
}
