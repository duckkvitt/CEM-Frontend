'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  MapPin, 
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'
import { EnhancedPagination } from '@/components/ui/enhanced-pagination'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { 
  Task, 
  TaskStatistics, 
  CreateTaskRequest,
  UpdateTaskRequest,
  getAllTasksForStaff,
  getTaskStatistics,
  createTask,
  updateTask,
  deleteTask,
  getTaskById
} from '@/lib/task-service'
import { getAllCustomers, type CustomerResponse } from '@/lib/customer-service'
import { DEVICE_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken } from '@/lib/auth'

const taskStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
}

const taskPriorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200'
}

const taskTypeColors: Record<string, string> = {
  MAINTENANCE: 'bg-green-100 text-green-800 border-green-200',
  WARRANTY: 'bg-blue-100 text-blue-800 border-blue-200',
  INSTALLATION: 'bg-purple-100 text-purple-800 border-purple-200',
  REPAIR: 'bg-orange-100 text-orange-800 border-orange-200',
  INSPECTION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  EMERGENCY_REPAIR: 'bg-red-100 text-red-800 border-red-200',
  PREVENTIVE_MAINTENANCE: 'bg-green-100 text-green-800 border-green-200'
}

export default function SupportTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<{ content: Task[], totalPages: number, totalElements: number, size: number, number: number } | null>(null)
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState<CreateTaskRequest>({
    customerId: 0,
    customerDeviceId: 0,
    title: '',
    description: '',
    type: 'MAINTENANCE',
    priority: 'NORMAL',
    preferredCompletionDate: ''
  })
  // Field-level errors for Create modal
  const [createErrors, setCreateErrors] = useState<{
    title?: string
    description?: string
    type?: string
    customerId?: string
    customerDeviceId?: string
    preferredCompletionDate?: string
  }>({})

  const [editForm, setEditForm] = useState<UpdateTaskRequest>({
    title: '',
    description: '',
    type: 'MAINTENANCE',
    priority: 'NORMAL',
    preferredCompletionDate: ''
  })
  // Data for Create Task modal selects
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [devices, setDevices] = useState<Array<{ id: number; name: string; model?: string; serialNumber?: string }>>([])
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0)

  // Role-based access control
  useEffect(() => {
    const userRole = getCurrentUserRole()
    if (!userRole || !['SUPPORT_TEAM', 'LEAD_TECH'].includes(userRole)) {
      router.push('/dashboard')
      return
    }
  }, [router])

  // Load data
  useEffect(() => {
    loadTasks()
    loadStatistics()
  }, [searchTerm, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder, page, size])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await getAllTasksForStaff({
        search: searchTerm || undefined,
        status: statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter && priorityFilter !== 'ALL' ? priorityFilter : undefined,
        type: typeFilter && typeFilter !== 'ALL' ? typeFilter : undefined,
        sortBy,
        sortOrder,
        page,
        size
      })
      setTasks(data)
      setError(null)
    } catch (err) {
      setError('Failed to load tasks')
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const stats = await getTaskStatistics()
      setStatistics(stats)
    } catch (err) {
      console.error('Failed to load statistics:', err)
    }
  }

  // Validate create form mirroring backend (CreateTaskRequest.java)
  const validateCreateForm = () => {
    const errs: typeof createErrors = {}
    const title = (createForm.title || '').trim()
    const description = (createForm.description || '').trim()

    if (!title) errs.title = 'Title is required'
    else if (title.length < 5 || title.length > 255) errs.title = 'Title must be between 5 and 255 characters'

    if (!description) errs.description = 'Description is required'
    else if (description.length < 10 || description.length > 2000) errs.description = 'Description must be between 10 and 2000 characters'

    if (!createForm.type) errs.type = 'Task type is required'
    if (!selectedCustomerId || selectedCustomerId === 0) errs.customerId = 'Customer is required'
    if (!createForm.customerDeviceId || createForm.customerDeviceId === 0) errs.customerDeviceId = 'Customer device is required'

    // Datetime format basic check if provided (backend expects LocalDateTime via scheduledDate)
    if (createForm.preferredCompletionDate) {
      const d = new Date(createForm.preferredCompletionDate)
      if (isNaN(d.getTime())) {
        errs.preferredCompletionDate = 'Invalid date/time'
      }
    }

    setCreateErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreateTask = async () => {
    if (!validateCreateForm()) {
      setError('Please fix the highlighted errors')
      return
    }

    try {
      setActionLoading(true)
      await createTask(createForm)
      setCreateModalOpen(false)
      setCreateForm({
        customerId: 0,
        customerDeviceId: 0,
        title: '',
        description: '',
        type: 'MAINTENANCE',
        priority: 'NORMAL',
        preferredCompletionDate: ''
      })
      setSelectedCustomerId(0)
      setCreateErrors({})
      await loadTasks()
      await loadStatistics()
      setError(null)
    } catch (err) {
      setError('Failed to create task')
      console.error('Failed to create task:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditTask = async () => {
    if (!selectedTask || !editForm.title?.trim() || !editForm.description?.trim()) {
      setError('Title and description are required')
      return
    }

    try {
      setActionLoading(true)
      await updateTask(selectedTask.id, editForm)
      setEditModalOpen(false)
      setSelectedTask(null)
      await loadTasks()
      setError(null)
    } catch (err) {
      setError('Failed to update task')
      console.error('Failed to update task:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return

    try {
      setActionLoading(true)
      await deleteTask(selectedTask.id)
      setDeleteModalOpen(false)
      setSelectedTask(null)
      await loadTasks()
      await loadStatistics()
      setError(null)
    } catch (err) {
      setError('Failed to delete task')
      console.error('Failed to delete task:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewTask = async (task: Task) => {
    try {
      const fullTask = await getTaskById(task.id)
      setSelectedTask(fullTask)
      setViewModalOpen(true)
    } catch (err) {
      setError('Failed to load task details')
      console.error('Failed to load task details:', err)
    }
  }

  const openEditModal = (task: Task) => {
    setSelectedTask(task)
    setEditForm({
      title: task.title,
      description: task.description,
      type: (['MAINTENANCE', 'WARRANTY', 'INSTALLATION', 'REPAIR', 'INSPECTION'].includes(task.type as any)
        ? task.type
        : 'MAINTENANCE') as any,
      priority: task.priority,
      preferredCompletionDate: ''
    })
    setEditModalOpen(true)
  }

  const openDeleteModal = (task: Task) => {
    setSelectedTask(task)
    setDeleteModalOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setTypeFilter('ALL')
    setPage(0)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setSize(newSize)
    setPage(0) // Reset to first page when changing page size
  }

  // Load customers when create modal opens
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
    if (createModalOpen) {
      loadCustomers()
    } else {
      setSelectedCustomerId(0)
      setDevices([])
    }
  }, [createModalOpen])
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

  if (loading && (!tasks || tasks.content.length === 0)) {
    return (
      <div className="flex min-h-screen w-full">
        <main className="ml-64 flex-1 bg-background p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
                <p className="text-gray-600">
                  Manage tasks created from service requests and manual tasks
                </p>
              </div>
          {/* Create Task button hidden */}
          {false && (
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          )}
            </div>
          </motion.div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalTasks}</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.pendingTasks}</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Loader2 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.inProgressTasks}</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.completedTasks}</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All priorities</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All types</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="WARRANTY">Warranty</SelectItem>
                      <SelectItem value="INSTALLATION">Installation</SelectItem>
                      <SelectItem value="REPAIR">Repair</SelectItem>
                      <SelectItem value="INSPECTION">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="preferredCompletionDate">Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </>
            ) : !tasks || tasks.content.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground text-center">
                    No tasks match your current filters. Try adjusting your search criteria.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.content.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold">{task.title}</h3>
                            <Badge 
                              variant="outline" 
                              className={taskStatusColors[task.status]}
                            >
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={taskPriorityColors[task.priority]}
                            >
                              {task.priority}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={taskTypeColors[task.type]}
                            >
                              {task.type}
                            </Badge>
                          </div>

                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{task.customerName || 'No customer'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{task.deviceName}</span>
                            </div>
                            {task.assignedToName && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Assigned to: {task.assignedToName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(task.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {/* Gate edit/delete buttons by role */}
                          {['SUPPORT_TEAM', 'LEAD_TECH'].includes(getCurrentUserRole() || '') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(task)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteModal(task)}
                                className="gap-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTask(task)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Enhanced Pagination */}
          {tasks && tasks.totalPages > 1 && (
            <div className="mt-8">
              <EnhancedPagination
                currentPage={page}
                totalPages={tasks.totalPages}
                totalElements={tasks.totalElements}
                pageSize={size}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
                showPageSizeSelector={true}
                showJumpToPage={true}
                showTotalInfo={true}
                pageSizeOptions={[5, 10, 20, 50, 100]}
              />
            </div>
          )}
        </div>

        {/* Create Task Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
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
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="col-span-3"
                />
                {createErrors.title && (
                  <div className="col-start-2 col-span-3 text-sm text-red-600">{createErrors.title}</div>
                )}
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="create-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="create-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  rows={3}
                />
                {createErrors.description && (
                  <div className="col-start-2 col-span-3 text-sm text-red-600">{createErrors.description}</div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-type" className="text-right">
                  Type
                </Label>
                <Select value={createForm.type} onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value as any }))}>
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
                {createErrors.type && (
                  <div className="col-start-2 col-span-3 text-sm text-red-600">{createErrors.type}</div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-priority" className="text-right">
                  Priority
                </Label>
                <Select value={createForm.priority} onValueChange={(value) => setCreateForm(prev => ({ ...prev, priority: value as any }))}>
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
                    setCreateForm(prev => ({ ...prev, customerId: id, customerDeviceId: 0 }))
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
                {createErrors.customerId && (
                  <div className="col-start-2 col-span-3 text-sm text-red-600">{createErrors.customerId}</div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-device-id" className="text-right">
                  Customer Device
                </Label>
                <Select
                  value={createForm.customerDeviceId ? String(createForm.customerDeviceId) : ''}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, customerDeviceId: Number(value) }))}
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
                {createErrors.customerDeviceId && (
                  <div className="col-start-2 col-span-3 text-sm text-red-600">{createErrors.customerDeviceId}</div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-scheduled-date" className="text-right">
                  Scheduled Date
                </Label>
                <Input
                  id="create-scheduled-date"
                  type="datetime-local"
                  value={createForm.preferredCompletionDate || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, preferredCompletionDate: e.target.value }))}
                  className="col-span-3"
                />
                {createErrors.preferredCompletionDate && (
                  <div className="col-start-2 col-span-3 text-sm text-red-600">{createErrors.preferredCompletionDate}</div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={actionLoading}
                className="gap-2"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Task Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the task details below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Task Title *</Label>
                <Input
                  id="editTitle"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Description *</Label>
                <Textarea
                  id="editDescription"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editType">Type</Label>
                  <Select 
                    value={editForm.type} 
                    onValueChange={(value) => setEditForm({ ...editForm, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="WARRANTY">Warranty</SelectItem>
                      <SelectItem value="INSTALLATION">Installation</SelectItem>
                      <SelectItem value="REPAIR">Repair</SelectItem>
                      <SelectItem value="INSPECTION">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editPriority">Priority</Label>
                  <Select 
                    value={editForm.priority} 
                    onValueChange={(value) => setEditForm({ ...editForm, priority: value as any })}
                  >
                    <SelectTrigger>
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
              </div>

              

              <div>
                <Label htmlFor="edit-scheduled">Scheduled Date</Label>
                <Input
                  id="edit-scheduled"
                  type="datetime-local"
                  value={editForm.preferredCompletionDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, preferredCompletionDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editNotes">Staff Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editForm.staffNotes}
                  onChange={(e) => setEditForm({ ...editForm, staffNotes: e.target.value })}
                  placeholder="Enter staff notes"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTask}
                disabled={actionLoading}
                className="gap-2"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Task Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
              <DialogDescription>
                View complete task information and history.
              </DialogDescription>
            </DialogHeader>

            {selectedTask && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Task ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.taskId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={taskStatusColors[selectedTask.status]}>
                      {selectedTask.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge className={taskPriorityColors[selectedTask.priority]}>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <Badge className={taskTypeColors[selectedTask.type]}>
                      {selectedTask.type}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-muted-foreground">{selectedTask.title}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Customer</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Device</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.deviceName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.assignedToName || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created By</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.createdBy}</p>
                  </div>
                </div>

                

                {selectedTask.staffNotes && (
                  <div>
                    <Label className="text-sm font-medium">Staff Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.staffNotes}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Created At</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedTask.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Updated At</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedTask.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {selectedTask.history && selectedTask.history.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Task History</Label>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedTask.history.map((entry, index) => (
                        <div key={entry.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={taskStatusColors[entry.status]}>
                              {entry.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {entry.comment && (
                            <p className="text-sm text-muted-foreground">{entry.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {entry.updatedBy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {selectedTask && (
              <div className="py-4">
                <p className="text-sm">
                  <strong>Task:</strong> {selectedTask.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.description}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTask}
                disabled={actionLoading}
                className="gap-2"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}
