'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { EnhancedPagination } from '@/components/ui/enhanced-pagination'
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
  UserPlus,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUserRole } from '@/lib/auth'
import { 
  getAllTasks,
  getTaskStatistics,
  assignTask,
  getTechniciansForAssignment,
  Task,
  TaskStatistics,
  TechnicianInfo,
  Page,
  AssignTaskRequest
} from '@/lib/task-service'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
}

const STATUS_ICONS = {
  PENDING: Clock,
  ASSIGNED: UserPlus,
  ACCEPTED: CheckCircle,
  IN_PROGRESS: Wrench,
  COMPLETED: CheckCircle,
  REJECTED: AlertCircle
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
}

const TYPE_COLORS = {
  MAINTENANCE: 'bg-blue-100 text-blue-800',
  WARRANTY: 'bg-green-100 text-green-800',
  INSTALLATION: 'bg-purple-100 text-purple-800',
  INSPECTION: 'bg-indigo-100 text-indigo-800',
  REPAIR: 'bg-orange-100 text-orange-800',
  EMERGENCY_REPAIR: 'bg-red-100 text-red-800',
  PREVENTIVE_MAINTENANCE: 'bg-teal-100 text-teal-800'
}

// Real technician data interface mapped from TechnicianInfo
interface TechnicianWorkload {
  id: number
  name: string
  email: string
  skills: string[]
  currentTasks: number
  maxTasks: number
  workloadPercentage: number
  availabilityStatus: string
}

export default function TechLeadTasksPage() {
  const [tasks, setTasks] = useState<Page<Task> | null>(null)
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null)
  const [technicians, setTechnicians] = useState<TechnicianWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'PENDING' as string,
    priority: 'ALL' as string,
    page: 0,
    size: 10
  })

  // Assignment modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [assignForm, setAssignForm] = useState<AssignTaskRequest>({
    technicianId: 0,
    scheduledDate: '',
    techleadNotes: ''
  })

  const router = useRouter()

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && role !== 'LEAD_TECH') {
      router.replace('/dashboard')
    }
  }, [role, router])

  useEffect(() => {
    if (role === 'LEAD_TECH') {
      fetchData()
    }
  }, [role, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch tasks
      const tasksData = await getAllTasks({
        page: filters.page,
        size: filters.size,
        sortBy: 'createdAt',
        sortDir: 'desc',
        status: filters.status === 'ALL' ? undefined : filters.status
      })
      setTasks(tasksData)
      
      // Fetch statistics
      const statsData = await getTaskStatistics()
      setStatistics(statsData)

      // Fetch real technicians data
      const techniciansData = await getTechniciansForAssignment()
      const mappedTechnicians: TechnicianWorkload[] = techniciansData.map(tech => ({
        id: tech.id,
        name: tech.fullName,
        email: tech.email,
        skills: tech.skills && typeof tech.skills === 'string' ? tech.skills.split(', ') : [],
        currentTasks: tech.currentTaskCount,
        maxTasks: tech.maxConcurrentTasks,
        workloadPercentage: tech.workloadPercentage,
        availabilityStatus: tech.availabilityStatus
      }))
      setTechnicians(mappedTechnicians)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch tasks'
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

  const handlePageSizeChange = (size: number) => {
    setFilters(prev => ({
      ...prev,
      size,
      page: 0 // Reset to first page when changing page size
    }))
  }

  const handleAssignTask = (task: Task) => {
    setSelectedTask(task)
    setAssignForm({
      technicianId: 0,
      scheduledDate: task.scheduledDate || '',
      techleadNotes: ''
    })
    setAssignModalOpen(true)
  }

  const submitAssignment = async () => {
    if (!selectedTask) return
    
    setSubmitting(true)
    try {
      await assignTask(selectedTask.id, assignForm)
      setAssignModalOpen(false)
      setSelectedTask(null)
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign task'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const getAvailableTechnicians = () => {
    return technicians.filter(tech => tech.currentTasks < tech.maxTasks)
  }
  const availableTechnicians = getAvailableTechnicians()
  const selectedTechnician = availableTechnicians.find(tech => tech.id === assignForm.technicianId)

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
  const formatEnumLabel = (value?: string) => {
    if (!value) return 'N/A'
    return value
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock
    return <Icon className="h-4 w-4" />
  }

  if (role && role !== 'LEAD_TECH') {
    return null
  }

  if (loading && !tasks) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Assignment Management</h1>
            <p className="text-gray-600">
              Assign tasks to technicians and monitor workload distribution
            </p>
          </div>
          <Button onClick={() => router.push('/techlead/technicians')} variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            View Technicians
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
              <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pendingTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <UserPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.assignedTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Wrench className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.inProgressTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.highPriorityTasks + statistics.criticalPriorityTasks}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Technician Availability Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Technician Availability
            </CardTitle>
            <CardDescription>Current workload distribution across all technicians</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {technicians.map(technician => {
                const available = technician.maxTasks - technician.currentTasks
                return (
                  <div key={technician.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{technician.name}</h4>
                      <Badge variant={
                        technician.workloadPercentage > 80 ? 'destructive' : 
                        technician.workloadPercentage > 60 ? 'secondary' : 'default'
                      }>
                        {technician.currentTasks}/{technician.maxTasks}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          technician.workloadPercentage > 80 ? 'bg-red-500' : 
                          technician.workloadPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${technician.workloadPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {available} slots available
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {technician.skills.slice(0, 2).map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by task ID, title, or device..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-48">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending Assignment</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
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
        ) : tasks?.content.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                {filters.keyword || filters.status !== 'ALL'
                  ? 'Try adjusting your search criteria'
                  : 'No tasks match the current filter'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          tasks?.content.map((task, index) => (
            <motion.div
              key={task.id}
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
                          {task.taskId}
                        </CardTitle>
                        <Badge className={STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]}>
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}>
                          {task.priority}
                        </Badge>
                        <Badge className={TYPE_COLORS[task.type as keyof typeof TYPE_COLORS]}>
                          {task.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="text-base mb-1">{task.title}</CardTitle>
                      <CardDescription>
                        Device: {task.deviceName}
                        {task.deviceModel && ` (${task.deviceModel})`}
                        {task.assignedTechnicianName && ` â€¢ Assigned to: ${task.assignedTechnicianName}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignTask(task)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign
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
                        {task.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Created</Label>
                        <p className="text-gray-900 mt-1">{formatDate(task.createdAt)}</p>
                      </div>
                      
                      {task.scheduledDate && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Scheduled</Label>
                          <p className="text-gray-900 mt-1">{formatDate(task.scheduledDate)}</p>
                        </div>
                      )}
                      
                      {task.estimatedDurationHours && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Duration</Label>
                          <p className="text-gray-900 mt-1">{task.estimatedDurationHours}h</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Cost</Label>
                        <p className="text-gray-900 mt-1">
                          {task.actualCost 
                            ? formatPrice(task.actualCost)
                            : task.estimatedCost 
                              ? `Est. ${formatPrice(task.estimatedCost)}`
                              : 'Not specified'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {task.serviceLocation && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Service Location</Label>
                        <p className="text-gray-900 mt-1">{task.serviceLocation}</p>
                      </div>
                    )}
                    
                    {task.rejectionReason && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Rejection Reason</Label>
                        <p className="text-red-700 mt-1">{task.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Enhanced Pagination */}
      {tasks && tasks.totalPages > 1 && (
        <div className="mt-8">
          <EnhancedPagination
            currentPage={filters.page}
            totalPages={tasks.totalPages}
            totalElements={tasks.totalElements}
            pageSize={filters.size}
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

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-4xl sm:max-w-4xl md:max-w-5xl xl:max-w-6xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 text-left border-b">
            <DialogTitle className="text-2xl font-semibold">Assign Task to Technician</DialogTitle>
            <DialogDescription>
              Select a technician and provide assignment details for task: {selectedTask?.taskId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="px-6 py-6 space-y-6 md:max-w-2xl md:pr-8">
              <div className="space-y-2">
                <Label htmlFor="technician" className="text-sm font-medium text-muted-foreground">
                  Technician
                </Label>
                <Select
                  value={assignForm.technicianId.toString()}
                  onValueChange={(value) => setAssignForm(prev => ({ ...prev, technicianId: parseInt(value) }))}
                >
                  <SelectTrigger className="w-full items-start text-left gap-2 py-3 pl-4 pr-10 min-h-[74px] [&>span]:line-clamp-none [&>span]:whitespace-normal">
                    <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTechnicians.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No technicians available
                      </SelectItem>
                    ) : (
                      availableTechnicians.map(tech => {
                        const workloadBadge: 'destructive' | 'secondary' | 'outline' =
                          tech.workloadPercentage > 80
                            ? 'destructive'
                            : tech.workloadPercentage > 60
                              ? 'secondary'
                              : 'outline'

                        return (
                          <SelectItem
                            key={tech.id}
                            value={tech.id.toString()}
                            className="flex-col items-start gap-1 text-left"
                          >
                            <span className="text-sm font-medium leading-5">{tech.name}</span>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant={workloadBadge} className={workloadBadge === 'outline' ? '' : 'border-transparent'}>
                                {tech.currentTasks}/{tech.maxTasks} tasks
                              </Badge>
                              <span className="truncate max-w-[220px]">
                                {tech.skills && tech.skills.length > 0 ? tech.skills.slice(0, 2).join(', ') : 'General'}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled-date" className="text-sm font-medium text-muted-foreground">
                  Scheduled Date
                </Label>
                <Input
                  id="scheduled-date"
                  type="datetime-local"
                  value={assignForm.scheduledDate}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="techlead-notes" className="text-sm font-medium text-muted-foreground">
                  Assignment Notes
                </Label>
                <Textarea
                  id="techlead-notes"
                  value={assignForm.techleadNotes}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, techleadNotes: e.target.value }))}
                  rows={4}
                  placeholder="Add any special instructions or notes for the technician..."
                  className="min-h-[120px]"
                />
              </div>
            </div>

            <aside className="space-y-5 border-t bg-muted/50 px-6 py-6 md:border-0 md:border-l">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Task summary</p>
                <div className="mt-3 space-y-2">
                  <h3 className="text-base font-semibold leading-5 text-foreground">{selectedTask?.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedTask?.taskId && (
                      <Badge variant="outline" className="text-xs font-medium">#{selectedTask.taskId}</Badge>
                    )}
                    {selectedTask && (
                      <Badge
                        variant="outline"
                        className={`border-transparent text-xs font-medium ${PRIORITY_COLORS[selectedTask.priority] ?? ''}`}
                      >
                        {formatEnumLabel(selectedTask.priority)}
                      </Badge>
                    )}
                    {selectedTask && (
                      <Badge
                        variant="outline"
                        className={`border-transparent text-xs font-medium ${TYPE_COLORS[selectedTask.type] ?? ''}`}
                      >
                        {formatEnumLabel(selectedTask.type)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                {selectedTask?.customerName && (
                  <div>
                    <span className="font-medium text-foreground/80">Customer:</span> {selectedTask.customerName}
                  </div>
                )}
                <div>
                  <span className="font-medium text-foreground/80">Device:</span> {selectedTask?.deviceName}
                </div>
                {selectedTask?.preferredCompletionDate && (
                  <div>
                    <span className="font-medium text-foreground/80">Preferred completion:</span> {formatDate(selectedTask.preferredCompletionDate)}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border bg-background p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Technician preview</p>
                {selectedTechnician ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{selectedTechnician.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTechnician.email}</p>
                      </div>
                      <Badge
                        variant={selectedTechnician.workloadPercentage > 80 ? 'destructive' : selectedTechnician.workloadPercentage > 60 ? 'secondary' : 'outline'}
                        className="border-transparent text-xs font-medium"
                      >
                        {selectedTechnician.currentTasks + 1}/{selectedTechnician.maxTasks}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(selectedTechnician.skills && selectedTechnician.skills.length > 0 ? selectedTechnician.skills : ['General Maintenance']).slice(0, 3).map(skill => (
                        <Badge key={skill} variant="outline" className="text-[11px] font-medium">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                      After assignment: {Math.min(selectedTechnician.currentTasks + 1, selectedTechnician.maxTasks)}/{selectedTechnician.maxTasks} tasks
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Select a technician to preview their availability and skills.</p>
                )}
              </div>
            </aside>
          </div>
          <DialogFooter className="gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAssignment}
              disabled={submitting || assignForm.technicianId === 0}
              className="sm:ml-auto"
            >
              {submitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}







