'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Wrench, 
  Shield,
  Eye,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Star
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUserRole } from '@/lib/auth'
import { 
  getCustomerServiceRequests, 
  getServiceRequestStatistics,
  ServiceRequest,
  ServiceRequestStatistics,
  Page
} from '@/lib/service-request-service'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800'
}

const STATUS_ICONS = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  IN_PROGRESS: Wrench,
  COMPLETED: CheckCircle
}

const TYPE_COLORS = {
  MAINTENANCE: 'bg-blue-100 text-blue-800',
  WARRANTY: 'bg-green-100 text-green-800'
}

const TYPE_ICONS = {
  MAINTENANCE: Wrench,
  WARRANTY: Shield
}

export default function ServiceRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<Page<ServiceRequest> | null>(null)
  const [statistics, setStatistics] = useState<ServiceRequestStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'maintenance' | 'warranty'>('all')
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'ALL' as string,
    page: 0,
    size: 10
  })
  const router = useRouter()

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && role !== 'CUSTOMER') {
      router.replace('/dashboard')
    }
  }, [role, router])

  useEffect(() => {
    if (role === 'CUSTOMER') {
      fetchData()
    }
  }, [role, filters, activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch service requests
      const requestsData = await getCustomerServiceRequests({
        keyword: filters.keyword || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status as any,
        type: activeTab === 'all' ? undefined : activeTab.toUpperCase() as any,
        page: filters.page,
        size: filters.size,
        sortBy: 'createdAt',
        sortDir: 'desc'
      })
      setServiceRequests(requestsData)
      
      // Fetch statistics
      const statsData = await getServiceRequestStatistics()
      setStatistics(statsData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch service requests'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 0 // Reset to first page when filtering
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }))
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'maintenance' | 'warranty')
    setFilters(prev => ({
      ...prev,
      page: 0
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock
    return <Icon className="h-4 w-4" />
  }

  const getTypeIcon = (type: string) => {
    const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Wrench
    return <Icon className="h-4 w-4" />
  }

  if (role && role !== 'CUSTOMER') {
    return null
  }

  if (loading && !serviceRequests) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Requests</h1>
        <p className="text-gray-600">
          Track and manage your maintenance and warranty requests
        </p>
      </motion.div>

      {/* Statistics Cards */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pendingRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Wrench className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.inProgressRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.completedRequests}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters and Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-6"
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="warranty" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Warranty
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by request ID, device name, or description..."
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-48">
                <Label htmlFor="status-filter" className="sr-only">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Service Requests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-4"
      >
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : serviceRequests?.content.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests found</h3>
              <p className="text-gray-600 mb-4">
                {filters.keyword || filters.status !== 'ALL'
                  ? 'Try adjusting your search criteria'
                  : 'You haven\'t submitted any service requests yet'
                }
              </p>
              <Button onClick={() => router.push('/my-devices')}>
                View My Devices
              </Button>
            </CardContent>
          </Card>
        ) : (
          serviceRequests?.content.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          {request.requestId}
                        </CardTitle>
                        <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
                          {getStatusIcon(request.status)}
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={TYPE_COLORS[request.type as keyof typeof TYPE_COLORS]}>
                          {getTypeIcon(request.type)}
                          {request.type}
                        </Badge>
                      </div>
                      <CardDescription>
                        Device: {request.deviceName}
                        {request.deviceModel && ` (${request.deviceModel})`}
                        {request.serialNumber && ` • Serial: ${request.serialNumber}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/service-requests/${request.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {request.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/service-requests/${request.id}?feedback=1`)}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Give Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-gray-900 mt-1 line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Created</Label>
                        <p className="text-gray-900 mt-1">{formatDate(request.createdAt)}</p>
                      </div>
                      
                      {request.preferredDateTime && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Preferred Date</Label>
                          <p className="text-gray-900 mt-1">{formatDate(request.preferredDateTime)}</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Cost</Label>
                        <p className="text-gray-900 mt-1">
                          {request.actualCost 
                            ? formatPrice(request.actualCost)
                            : request.estimatedCost 
                              ? `Est. ${formatPrice(request.estimatedCost)}`
                              : 'Not specified'
                          }
                        </p>
                      </div>
                    </div>

                    {request.workLocation && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Work Location</Label>
                        <p className="text-gray-900 mt-1 line-clamp-2">
                          {request.workLocation}
                        </p>
                      </div>
                    )}
                    
                    {request.attachments && request.attachments.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Attachments</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {request.attachments.length} file{request.attachments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {request.staffNotes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Staff Notes</Label>
                        <p className="text-gray-900 mt-1 line-clamp-2">
                          {request.staffNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {serviceRequests && serviceRequests.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(filters.page - 1)}
                  className={filters.page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: serviceRequests.totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => handlePageChange(i)}
                    isActive={filters.page === i}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(filters.page + 1)}
                  className={filters.page === serviceRequests.totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </motion.div>
      )}
    </div>
  )
} 