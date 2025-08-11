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
                        {task.assignedTechnicianName && ` • Assigned to: ${task.assignedTechnicianName}`}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/techlead/tasks/${task.id}`)}
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

      {/* Pagination */}
      {tasks && tasks.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
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
              
              {Array.from({ length: tasks.totalPages }, (_, i) => (
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
                  className={filters.page === tasks.totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </motion.div>
      )}

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Task to Technician</DialogTitle>
            <DialogDescription>
              Select a technician and provide assignment details for task: {selectedTask?.taskId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="technician" className="text-right">
                Technician
              </Label>
              <Select 
                value={assignForm.technicianId.toString()} 
                onValueChange={(value) => setAssignForm(prev => ({ ...prev, technicianId: parseInt(value) }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTechnicians().map(tech => {
                    return (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{tech.name}</span>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant={tech.workloadPercentage > 60 ? 'secondary' : 'default'} className="text-xs">
                              {tech.currentTasks}/{tech.maxTasks}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {tech.skills && tech.skills.length > 0 ? tech.skills.slice(0, 2).join(', ') : 'General'}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
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
                value={assignForm.scheduledDate}
                onChange={(e) => setAssignForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="techlead-notes" className="text-right">
                Assignment Notes
              </Label>
              <Textarea
                id="techlead-notes"
                value={assignForm.techleadNotes}
                onChange={(e) => setAssignForm(prev => ({ ...prev, techleadNotes: e.target.value }))}
                className="col-span-3"
                rows={3}
                placeholder="Add any special instructions or notes for the technician..."
              />
            </div>

            {assignForm.technicianId > 0 && (
              <div className="col-span-4 mt-4 p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-700">Selected Technician Info</Label>
                {(() => {
                  const selectedTech = getAvailableTechnicians().find(t => t.id === assignForm.technicianId)
                  return selectedTech ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{selectedTech.name}</span>
                        <Badge variant={selectedTech.workloadPercentage > 60 ? 'secondary' : 'default'}>
                          {selectedTech.currentTasks + 1}/{selectedTech.maxTasks} after assignment
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Skills: {selectedTech.skills && selectedTech.skills.length > 0 ? selectedTech.skills.join(', ') : 'General Maintenance'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Email: {selectedTech.email}
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitAssignment} 
              disabled={submitting || assignForm.technicianId === 0}
            >
              {submitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
