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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  ThumbsUp,
  ThumbsDown,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUserRole } from '@/lib/auth'
import { 
  getAllServiceRequestsForStaff,
  getPendingServiceRequests,
  getAllServiceRequestStatistics,
  ServiceRequest,
  ServiceRequestStatistics,
  Page
} from '@/lib/service-request-service'
import { 
  approveServiceRequest,
  rejectServiceRequest,
  ApproveServiceRequestRequest,
  RejectServiceRequestRequest,
  createTask,
  CreateTaskRequest
} from '@/lib/task-service'
import { getAllCustomers, type CustomerResponse } from '@/lib/customer-service'
import { DEVICE_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken } from '@/lib/auth'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800'
}

const STATUS_ICONS = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  ASSIGNED: CheckCircle,
  REJECTED: AlertCircle,
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

export default function SupportServiceRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<Page<ServiceRequest> | null>(null)
  const [statistics, setStatistics] = useState<ServiceRequestStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'assigned' | 'rejected'>('pending')
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'ALL' as string,
    page: 0,
    size: 3
  })

  // Pagination state for each tab
  const [paginationState, setPaginationState] = useState({
    pending: { page: 0, size: 3 },
    approved: { page: 0, size: 3 },
    assigned: { page: 0, size: 3 },
    rejected: { page: 0, size: 3 },
    all: { page: 0, size: 3 }
  })

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [approveForm, setApproveForm] = useState<ApproveServiceRequestRequest>({
    taskTitle: '',
    additionalNotes: '',
    taskType: 'MAINTENANCE',
    priority: 'NORMAL',
    scheduledDate: '',
    estimatedDurationHours: undefined,
    serviceLocation: '',
    customerContactInfo: '',
    supportNotes: ''
  })

  const [rejectForm, setRejectForm] = useState<RejectServiceRequestRequest>({ rejectedReason: '' })
  const [rejectFormErrors, setRejectFormErrors] = useState<{ rejectedReason?: string }>({})

  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskRequest>({
    customerId: 0,
    customerDeviceId: 0,
    title: '',
    description: '',
    type: 'MAINTENANCE',
    priority: 'NORMAL',
    preferredCompletionDate: ''
  })

  const router = useRouter()

  // Data for Create Task modal selects
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [devices, setDevices] = useState<Array<{ id: number; name: string; model?: string; serialNumber?: string }>>([])
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0)

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && !['SUPPORT_TEAM', 'MANAGER', 'ADMIN'].includes(role)) {
      router.replace('/dashboard')
    }
  }, [role, router])

  useEffect(() => {
    if (role && ['SUPPORT_TEAM', 'MANAGER', 'ADMIN'].includes(role)) {
      fetchData()
    }
  }, [role, filters, activeTab, paginationState])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get current pagination state for active tab
      const currentPagination = paginationState[activeTab]
      
      // Fetch service requests based on active tab
      let requestsData
      if (activeTab === 'pending') {
        requestsData = await getPendingServiceRequests({
          page: currentPagination.page,
          size: currentPagination.size,
          sortBy: 'createdAt',
          sortDir: 'asc'
        })
      } else {
        const statusFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase() as any
        requestsData = await getAllServiceRequestsForStaff({
          keyword: filters.keyword || undefined,
          status: filters.status === 'ALL' ? statusFilter : filters.status as any,
          page: currentPagination.page,
          size: currentPagination.size,
          sortBy: 'createdAt',
          sortDir: 'desc'
        })
      }
      setServiceRequests(requestsData)
      
      // Fetch statistics
      const statsData = await getAllServiceRequestStatistics()
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
      [field]: value
    }))
    
    // Reset pagination for current tab when filtering
    setPaginationState(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], page: 0 }
    }))
  }

  const handlePageChange = (page: number) => {
    setPaginationState(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], page }
    }))
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'pending' | 'approved' | 'assigned' | 'rejected')
    // Reset filters when changing tabs
    setFilters(prev => ({
      ...prev,
      keyword: '',
      status: 'ALL'
    }))
  }

  const handleApprove = (request: ServiceRequest) => {
    setSelectedRequest(request)
    setApproveForm({
      taskTitle: `${request.type} - ${request.deviceName}`,
      additionalNotes: '',
      taskType: request.type === 'MAINTENANCE' ? 'MAINTENANCE' : 'WARRANTY',
      priority: 'NORMAL',
      scheduledDate: '',
      estimatedDurationHours: undefined,
      serviceLocation: request.workLocation || '',
      customerContactInfo: '',
      supportNotes: ''
    })
    setApproveModalOpen(true)
  }

  const handleReject = (request: ServiceRequest) => {
    setSelectedRequest(request)
    setRejectForm({ rejectedReason: '' })
    setRejectFormErrors({})
    setRejectModalOpen(true)
  }

  const submitApproval = async () => {
    if (!selectedRequest) return
    
    setSubmitting(true)
    try {
      await approveServiceRequest(selectedRequest.id, approveForm)
      setApproveModalOpen(false)
      setSelectedRequest(null)
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve service request'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const submitRejection = async () => {
    if (!selectedRequest) return
    
    setSubmitting(true)
    setRejectFormErrors({})
    try {
      await rejectServiceRequest(selectedRequest.id, rejectForm)
      setRejectModalOpen(false)
      setSelectedRequest(null)
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject service request'
      
      // Check if it's a validation error for rejection reason
      if (msg.includes('Rejection reason must be between 10 and 2000 characters') || 
          msg.includes('rejectedReason') || 
          msg.includes('rejectionReason')) {
        setRejectFormErrors({ rejectedReason: msg })
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTask = () => {
    setCreateTaskForm({
      customerId: 0,
      customerDeviceId: 0,
      title: '',
      description: '',
      type: 'MAINTENANCE',
      priority: 'NORMAL',
      preferredCompletionDate: ''
    })
    setSelectedCustomerId(0)
    setCreateTaskModalOpen(true)
  }

  const submitCreateTask = async () => {
    setSubmitting(true)
    try {
      await createTask(createTaskForm)
      setCreateTaskModalOpen(false)
      router.push('/support/tasks')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create task'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Load customers when create task modal opens
  useEffect(() => {
    const loadCustomers = async () => {
      setCustomerLoading(true)
      try {
        const list = await getAllCustomers()
        setCustomers(list)
      } catch {
        setCustomers([])
      } finally {
        setCustomerLoading(false)
      }
    }
    if (createTaskModalOpen) {
      loadCustomers()
    }
  }, [createTaskModalOpen])

  // Load devices when a customer is selected
  useEffect(() => {
    const loadDevices = async (customerId?: number) => {
      if (!customerId || customerId === 0) {
        setDevices([])
        return
      }
      setDeviceLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('page', '0')
        params.append('size', '100')
        params.append('customerId', String(customerId))
        const url = `${DEVICE_SERVICE_URL}/customer-devices/staff?${params.toString()}`
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${await getValidAccessToken()}` },
          cache: 'no-store'
        })
        if (!res.ok) throw new Error('Failed to load devices')
        const json = await res.json()
        const content = Array.isArray(json?.data?.content) ? json.data.content : []
        const mapped = content.map((d: any) => ({ id: d.id, name: d.deviceName ?? d.name, model: d.deviceModel ?? d.model, serialNumber: d.serialNumber }))
        setDevices(mapped)
      } catch {
        setDevices([])
      } finally {
        setDeviceLoading(false)
      }
    }
    loadDevices(selectedCustomerId)
  }, [selectedCustomerId])

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

  if (role && !['SUPPORT_TEAM', 'MANAGER', 'ADMIN'].includes(role)) {
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
          <Button size="default" onClick={fetchData}>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Request Management</h1>
            <p className="text-gray-600">
              Review, approve, and reject customer service requests
            </p>
          </div>
          <Button onClick={handleCreateTask} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
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
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.approvedRequests}</div>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Assigned
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all">All Requests</TabsTrigger>
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
              
              {activeTab === 'all' && (
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
                      <SelectItem value="ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
          Array.from({ length: paginationState[activeTab].size }).map((_, i) => (
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
                  : `No ${activeTab === 'all' ? '' : activeTab} service requests found`
                }
              </p>
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
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(request)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(request)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/support/service-requests/${request.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
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
                      
                      
                    </div>

                    {request.workLocation && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Work Location</Label>
                        <p className="text-gray-900 mt-1 line-clamp-2">
                          {request.workLocation}
                        </p>
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
          {loading && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Loading...
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items Info */}
            <div className="text-sm text-gray-600">
              Showing {serviceRequests.content.length} of {serviceRequests.totalElements} items
            </div>

            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Page {paginationState[activeTab].page + 1} of {serviceRequests.totalPages}
            </div>

            {/* Pagination Controls */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    size="default"
                    onClick={() => handlePageChange(paginationState[activeTab].page - 1)}
                    className={paginationState[activeTab].page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100'}
                  />
                </PaginationItem>
                
                {/* Show page numbers with ellipsis for large page counts */}
                {serviceRequests.totalPages <= 7 ? (
                  // Show all pages if 7 or fewer
                  Array.from({ length: serviceRequests.totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        size="default"
                        onClick={() => handlePageChange(i)}
                        isActive={paginationState[activeTab].page === i}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))
                ) : (
                  // Show pages with ellipsis for large page counts
                  (() => {
                    const currentPage = paginationState[activeTab].page
                    const totalPages = serviceRequests.totalPages
                    const pages = []
                    
                    // Always show first page
                    pages.push(
                      <PaginationItem key={0}>
                        <PaginationLink 
                          size="default"
                          onClick={() => handlePageChange(0)}
                          isActive={currentPage === 0}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )
                    
                    // Show ellipsis if current page is far from start
                    if (currentPage > 3) {
                      pages.push(
                        <PaginationItem key="ellipsis1">
                          <span className="px-3 py-2 text-gray-500">...</span>
                        </PaginationItem>
                      )
                    }
                    
                    // Show pages around current page
                    const start = Math.max(1, currentPage - 1)
                    const end = Math.min(totalPages - 2, currentPage + 1)
                    
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink 
                            size="default"
                            onClick={() => handlePageChange(i)}
                            isActive={currentPage === i}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                    
                    // Show ellipsis if current page is far from end
                    if (currentPage < totalPages - 4) {
                      pages.push(
                        <PaginationItem key="ellipsis2">
                          <span className="px-3 py-2 text-gray-500">...</span>
                        </PaginationItem>
                      )
                    }
                    
                    // Always show last page
                    if (totalPages > 1) {
                      pages.push(
                        <PaginationItem key={totalPages - 1}>
                          <PaginationLink 
                            size="default"
                            onClick={() => handlePageChange(totalPages - 1)}
                            isActive={currentPage === totalPages - 1}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                    
                    return pages
                  })()
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    size="default"
                    onClick={() => handlePageChange(paginationState[activeTab].page + 1)}
                    className={paginationState[activeTab].page === serviceRequests.totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </motion.div>
      )}

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Service Request</DialogTitle>
            <DialogDescription>
              Convert this service request to a task by providing task details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-title" className="text-right">
                Task Title
              </Label>
              <Input
                id="task-title"
                value={approveForm.taskTitle}
                onChange={(e) => setApproveForm(prev => ({ ...prev, taskTitle: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-type" className="text-right">
                Task Type
              </Label>
              <Select value={approveForm.taskType} onValueChange={(value) => setApproveForm(prev => ({ ...prev, taskType: value as any }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="WARRANTY">Warranty</SelectItem>
                  <SelectItem value="INSTALLATION">Installation</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="EMERGENCY_REPAIR">Emergency Repair</SelectItem>
                  <SelectItem value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select value={approveForm.priority} onValueChange={(value) => setApproveForm(prev => ({ ...prev, priority: value as any }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduled-date" className="text-right">
                Scheduled Date
              </Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={approveForm.scheduledDate}
                onChange={(e) => setApproveForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estimated-duration" className="text-right">
                Est. Duration (hours)
              </Label>
              <Input
                id="estimated-duration"
                type="number"
                value={approveForm.estimatedDurationHours || ''}
                onChange={(e) => setApproveForm(prev => ({ ...prev, estimatedDurationHours: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-location" className="text-right">
                Service Location
              </Label>
              <Input
                id="service-location"
                value={approveForm.serviceLocation || ''}
                onChange={(e) => setApproveForm(prev => ({ ...prev, serviceLocation: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="additional-notes" className="text-right">
                Additional Notes
              </Label>
              <Textarea
                id="additional-notes"
                value={approveForm.additionalNotes || ''}
                onChange={(e) => setApproveForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitApproval} disabled={submitting || !approveForm.taskTitle}>
              {submitting ? 'Approving...' : 'Approve & Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Service Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this service request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="rejection-reason" className="text-right">
                Rejection Reason
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="rejection-reason"
                  value={rejectForm.rejectedReason}
                  onChange={(e) => {
                    setRejectForm(prev => ({ ...prev, rejectedReason: e.target.value }))
                    // Clear error when user starts typing
                    if (rejectFormErrors.rejectedReason) {
                      setRejectFormErrors({})
                    }
                  }}
                  className={rejectFormErrors.rejectedReason ? 'border-red-500 focus:border-red-500' : ''}
                  rows={4}
                  placeholder="Explain why this service request cannot be approved..."
                />
                {rejectFormErrors.rejectedReason && (
                  <p className="text-sm text-red-600 mt-1">{rejectFormErrors.rejectedReason}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitRejection} 
              disabled={submitting || !rejectForm.rejectedReason.trim()}
            >
              {submitting ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <Dialog open={createTaskModalOpen} onOpenChange={setCreateTaskModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a task manually without a service request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-title" className="text-right">
                Title
              </Label>
              <Input
                id="create-title"
                value={createTaskForm.title}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="create-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="create-description"
                value={createTaskForm.description}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-type" className="text-right">
                Type
              </Label>
              <Select value={createTaskForm.type} onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, type: value as any }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="WARRANTY">Warranty</SelectItem>
                  <SelectItem value="INSTALLATION">Installation</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="EMERGENCY_REPAIR">Emergency Repair</SelectItem>
                  <SelectItem value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-priority" className="text-right">
                Priority
              </Label>
              <Select value={createTaskForm.priority} onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, priority: value as any }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-customer-id" className="text-right">
                Customer
              </Label>
              <Select
                value={selectedCustomerId ? String(selectedCustomerId) : ''}
                onValueChange={(value) => {
                  const id = Number(value)
                  setSelectedCustomerId(id)
                  setCreateTaskForm(prev => ({ ...prev, customerId: id, customerDeviceId: 0 }))
                }}
              >
                <SelectTrigger id="create-customer-id" className="col-span-3">
                  <SelectValue placeholder={customerLoading ? 'Loading customers...' : 'Select a customer'} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      #{c.id} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-device-id" className="text-right">
                Customer Device
              </Label>
              <Select
                value={createTaskForm.customerDeviceId ? String(createTaskForm.customerDeviceId) : ''}
                onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, customerDeviceId: Number(value) }))}
                disabled={!selectedCustomerId || deviceLoading}
              >
                <SelectTrigger id="create-device-id" className="col-span-3">
                  <SelectValue placeholder={!selectedCustomerId ? 'Select a customer first' : (deviceLoading ? 'Loading devices...' : 'Select a device')} />
                </SelectTrigger>
                <SelectContent>
                  {devices.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      #{d.id} — {d.name}{d.model ? ` (${d.model})` : ''}{d.serialNumber ? ` • SN: ${d.serialNumber}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-scheduled-date" className="text-right">
                Scheduled Date
              </Label>
              <Input
                id="create-scheduled-date"
                type="datetime-local"
                value={createTaskForm.preferredCompletionDate || ''}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, preferredCompletionDate: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="create-notes" className="text-right">
                Description (additional)
              </Label>
              <Textarea
                id="create-notes"
                value={createTaskForm.description || ''}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitCreateTask} 
              disabled={submitting || !createTaskForm.title || !createTaskForm.description || selectedCustomerId === 0 || createTaskForm.customerDeviceId === 0}
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
