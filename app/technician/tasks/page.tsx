'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserRole, extractUserIdFromToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Clock, 
  Calendar, 
  User, 
  AlertCircle,
  FileText,
  DollarSign,
  Loader2,
  Info,
  Wrench
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { 
  Task, 
  TaskActionRequest,
  getMyTasks,
  acceptTask,
  rejectTask,
  updateTaskStatus,
  completeTask,
  getTaskById
} from '@/lib/task-service'
import { SparePartsExportModal } from '@/components/spare-parts-export-modal'
import { TaskSparePartsSection } from '@/components/task-spare-parts-section'

const taskStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
}

const taskPriorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-200',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200'
}

const taskTypeColors: Record<string, string> = {
  MAINTENANCE: 'bg-green-100 text-green-800 border-green-200',
  WARRANTY: 'bg-blue-100 text-blue-800 border-blue-200',
  INSTALLATION: 'bg-purple-100 text-purple-800 border-purple-200',
  INSPECTION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  REPAIR: 'bg-orange-100 text-orange-800 border-orange-200',
  EMERGENCY_REPAIR: 'bg-red-100 text-red-800 border-red-200',
  PREVENTIVE_MAINTENANCE: 'bg-green-100 text-green-800 border-green-200'
}

export default function TechnicianTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [technicianId, setTechnicianId] = useState<number | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortBy] = useState('preferredCompletionDate')
  const [sortOrder] = useState<'asc' | 'desc'>('asc')
  const [activeTab, setActiveTab] = useState('assigned')

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'start' | 'complete' | 'update'>('accept')
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Thêm state để trigger refresh

  // Form states
  const [actionComment, setActionComment] = useState('')
  const [actualCost, setActualCost] = useState<number>(0)

  // Define loadTasks function first using useCallback
  const loadTasks = useCallback(async () => {
    if (!technicianId) return

    try {
      setLoading(true)
      const data = await getMyTasks({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: 0,
        size: 50,
        sortBy,
        sortDir: sortOrder
      })
      // Apply client-side filtering for priority and type (since API only supports status)
      let filteredTasks = data.content
      
      if (priorityFilter !== 'ALL') {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter)
      }
      
      if (typeFilter !== 'ALL') {
        filteredTasks = filteredTasks.filter(task => task.type === typeFilter)
      }
      
      if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setTasks(filteredTasks)
      setError(null)
    } catch (err) {
      setError('Failed to load tasks')
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [technicianId, searchTerm, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder])

  // Role-based access control
  useEffect(() => {
    const userRole = getCurrentUserRole()
    if (!userRole || userRole !== 'TECHNICIAN') {
      router.push('/dashboard')
      return
    }

    // Extract technician ID from token
    const userId = extractUserIdFromToken()
    if (userId) {
      setTechnicianId(userId)
    }
  }, [router])

  // Load tasks
  useEffect(() => {
    if (technicianId) {
      loadTasks()
    }
  }, [technicianId, loadTasks])

  const handleTaskAction = async () => {
    if (!selectedTask || !technicianId) return

    const request: TaskActionRequest = {
      comment: actionComment.trim() || undefined,
      actualCost: actionType === 'complete' ? actualCost : undefined
    }

    try {
      setActionLoading(true)
      
      switch (actionType) {
        case 'accept':
          await acceptTask(selectedTask.id, request)
          break
        case 'reject':
          if (!actionComment.trim()) {
            setError('Rejection reason is required')
            return
          }
          await rejectTask(selectedTask.id, request)
          break
        case 'start':
          await updateTaskStatus(selectedTask.id, request)
          break
        case 'complete':
          await completeTask(selectedTask.id, request)
          break
        case 'update':
          await updateTaskStatus(selectedTask.id, request)
          break
      }

      setActionModalOpen(false)
      setSelectedTask(null)
      setActionComment('')
      setActualCost(0)
      await loadTasks()
      setError(null)
    } catch (err) {
      setError(`Failed to ${actionType} task`)
      console.error(`Failed to ${actionType} task:`, err)
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

  const openActionModal = (task: Task, action: typeof actionType) => {
    setSelectedTask(task)
    setActionType(action)
    setActionComment('')
    setActualCost(task.estimatedCost || 0)
    setActionModalOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setTypeFilter('ALL')
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    // Filter by tab
    switch (activeTab) {
      case 'assigned':
        filtered = tasks.filter(t => t.status === 'ASSIGNED')
        break
      case 'active':
        filtered = tasks.filter(t => t.status === 'IN_PROGRESS')
        break
      case 'completed':
        filtered = tasks.filter(t => t.status === 'COMPLETED')
        break
      case 'all':
      default:
        break
    }

    return filtered
  }

  const getActionButtonText = (action: typeof actionType) => {
    switch (action) {
      case 'accept': return 'Accept Task'
      case 'reject': return 'Reject Task'
      case 'start': return 'Start Task'
      case 'complete': return 'Complete Task'
      case 'update': return 'Update Status'
      default: return 'Action'
    }
  }

  const handleExportSuccess = () => {
    if (selectedTask) {
      // Refresh task details to show updated spare parts
      handleViewTask(selectedTask)
      // Trigger refresh để load lại spare parts usage
      setRefreshTrigger(prev => prev + 1)
    }
  }

  const openExportModal = () => {
    setExportModalOpen(true)
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Manage and track your assigned tasks</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
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
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                        <SelectItem value="INSTALLATION">Installation</SelectItem>
                        <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="WARRANTY">Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
                    </Button>
            <div className="text-sm text-gray-500">
              {getFilteredTasks().length} of {tasks.length} tasks
            </div>
                  </div>
                </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredTasks().map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                  >
              <Card>
                <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">{task.title}</CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className={`text-xs ${taskStatusColors[task.status]}`}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                    <Badge className={`text-xs ${taskPriorityColors[task.priority]}`}>
                                {task.priority}
                              </Badge>
                    <Badge className={`text-xs ${taskTypeColors[task.type]}`}>
                                {task.type}
                              </Badge>
                            </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{task.deviceName}</span>
                              </div>
                    
                              {task.preferredCompletionDate && (
                                <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Due: {format(new Date(task.preferredCompletionDate), 'MMM dd, yyyy')}
                        </span>
                                </div>
                              )}

                              {task.estimatedCost && (
                                <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Est. Cost: ${task.estimatedCost.toFixed(2)}
                        </span>
                                </div>
                              )}
                          </div>

                  <div className="flex gap-2 mt-4">
                            <Button
                      size="sm"
                              variant="outline"
                              onClick={() => handleViewTask(task)}
                      className="flex-1"
                            >
                      <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>

                    {task.status === 'ASSIGNED' && (
                      <>
                              <Button
                                size="sm"
                                onClick={() => openActionModal(task, 'accept')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                          variant="destructive"
                                onClick={() => openActionModal(task, 'reject')}
                          className="flex-1"
                              >
                          <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                      </>
                            )}

                    {task.status === 'ACCEPTED' && (
                              <Button
                                size="sm"
                                onClick={() => openActionModal(task, 'start')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                        <Play className="h-4 w-4 mr-2" />
                                Start
                              </Button>
                            )}

                    {task.status === 'IN_PROGRESS' && (
                              <Button
                                size="sm"
                                onClick={() => openActionModal(task, 'complete')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {getFilteredTasks().length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'You don\'t have any tasks assigned yet.'}
            </p>
          </div>
        )}

        {/* View Task Modal */}
        <Dialog open={viewModalOpen} onOpenChange={(open) => {
          // Không cho phép đóng modal khi export modal đang mở
          if (!open && exportModalOpen) {
            return
          }
          setViewModalOpen(open)
        }}>
          <DialogContent className="sm:max-w-5xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Wrench className="h-6 w-6 text-blue-600" />
                Task Details
              </DialogTitle>
              <DialogDescription className="text-base">
                Complete task information, history, and spare parts usage
              </DialogDescription>
            </DialogHeader>

            {selectedTask && (
              <div className="space-y-6">
                {/* Task Header with Status */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                      <p className="text-gray-600 text-lg">{selectedTask.description}</p>
                  </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`text-sm px-3 py-1 ${taskStatusColors[selectedTask.status]}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </Badge>
                      <Badge className={`text-sm px-3 py-1 ${taskPriorityColors[selectedTask.priority]}`}>
                      {selectedTask.priority}
                    </Badge>
                      <Badge className={`text-sm px-3 py-1 ${taskTypeColors[selectedTask.type]}`}>
                      {selectedTask.type}
                    </Badge>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">{selectedTask.customerName || 'N/A'}</p>
                </div>
                </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-green-600" />
                  <div>
                        <p className="text-sm text-gray-500">Device</p>
                        <p className="font-medium">{selectedTask.deviceName}</p>
                  </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="font-medium">
                          {selectedTask.preferredCompletionDate 
                            ? format(new Date(selectedTask.preferredCompletionDate), 'MMM dd, yyyy')
                            : 'Not specified'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Info className="h-5 w-5 text-gray-600" />
                          Task Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Task ID</Label>
                            <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                              {selectedTask.taskId}
                            </p>
                          </div>
                          
                          {selectedTask.deviceModel && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Device Model</Label>
                              <p className="text-sm text-gray-900">{selectedTask.deviceModel}</p>
                            </div>
                          )}
                          
                          {selectedTask.serialNumber && (
                  <div>
                              <Label className="text-sm font-medium text-gray-700">Serial Number</Label>
                              <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                {selectedTask.serialNumber}
                    </p>
                  </div>
                )}

                          <div className="grid grid-cols-2 gap-4">
                      <div>
                              <Label className="text-sm font-medium text-gray-700">Estimated Cost</Label>
                              <p className="text-sm text-gray-900">
                                {selectedTask.estimatedCost ? `$${selectedTask.estimatedCost.toFixed(2)}` : 'Not specified'}
                              </p>
                      </div>
                      <div>
                              <Label className="text-sm font-medium text-gray-700">Actual Cost</Label>
                              <p className="text-sm text-gray-900">
                                {selectedTask.actualCost ? `$${selectedTask.actualCost.toFixed(2)}` : 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5 text-amber-600" />
                          Staff Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {selectedTask.staffNotes && selectedTask.staffNotes.length > 0 ? (
                            selectedTask.staffNotes.map((note, index) => (
                              <div key={index} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-amber-600" />
                                  <span className="text-sm font-medium text-amber-800">{note.staffName}</span>
                                  <span className="text-xs text-amber-600">
                                    {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm text-amber-700">{note.note}</p>
                      </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No staff notes available</p>
                    )}
                  </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Clock className="h-5 w-5 text-emerald-600" />
                          Task History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {selectedTask.taskHistory && selectedTask.taskHistory.length > 0 ? (
                            selectedTask.taskHistory.map((history, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{history.status}</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(history.timestamp), 'MMM dd, yyyy HH:mm')}
                                  </p>
                                  {history.comment && (
                                    <p className="text-sm text-gray-600 mt-1">{history.comment}</p>
                                  )}
                                </div>
                  </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No task history available</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Spare Parts Section */}
                  <div>
                    <TaskSparePartsSection
                      taskId={selectedTask.id}
                      taskTitle={selectedTask.title}
                      onExportClick={openExportModal}
                      refreshTrigger={refreshTrigger}
                    />
                  </div>
                </div>

                {/* Timestamps */}
                <Card>
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-slate-600" />
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                        <Label className="text-gray-600">Created</Label>
                        <p className="font-medium">
                          {selectedTask.createdAt 
                            ? format(new Date(selectedTask.createdAt), 'MMM dd, yyyy HH:mm')
                            : 'Not specified'
                          }
                        </p>
                          </div>
                      <div>
                        <Label className="text-gray-600">Last Updated</Label>
                        <p className="font-medium">
                          {selectedTask.updatedAt 
                            ? format(new Date(selectedTask.updatedAt), 'MMM dd, yyyy HH:mm')
                            : 'Not specified'
                          }
                          </p>
                        </div>
                    </div>
                  </CardContent>
                </Card>
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

        {/* Spare Parts Export Modal */}
        {selectedTask && (
          <SparePartsExportModal
            isOpen={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            taskId={selectedTask.id}
            taskTitle={selectedTask.title}
            onExportSuccess={handleExportSuccess}
          />
        )}

        {/* Action Modal */}
        <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{getActionButtonText(actionType)}</DialogTitle>
              <DialogDescription>
                {actionType === 'accept' && 'Accept this task assignment and start working on it.'}
                {actionType === 'reject' && 'Reject this task assignment. Please provide a reason.'}
                {actionType === 'start' && 'Mark this task as in progress and start working on it.'}
                {actionType === 'complete' && 'Mark this task as completed. Provide any final notes and actual cost.'}
                {actionType === 'update' && 'Update the task status with current progress information.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedTask && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">{selectedTask.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>
              )}

              <div>
                <Label htmlFor="actionComment">
                  {actionType === 'reject' ? 'Rejection Reason *' : 'Comment'}
                </Label>
                <Textarea
                  id="actionComment"
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder={
                    actionType === 'reject' 
                      ? 'Please explain why you are rejecting this task...'
                      : 'Add any comments or notes...'
                  }
                  rows={3}
                  required={actionType === 'reject'}
                />
              </div>

              {actionType === 'complete' && (
                <div>
                  <Label htmlFor="actualCost">Actual Cost</Label>
                  <Input
                    id="actualCost"
                    type="number"
                    step="0.01"
                    value={actualCost}
                    onChange={(e) => setActualCost(parseFloat(e.target.value) || 0)}
                    placeholder="Enter actual cost"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTaskAction}
                disabled={actionLoading || (actionType === 'reject' && !actionComment.trim())}
                className="gap-2"
                variant={actionType === 'reject' ? 'destructive' : 'default'}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {getActionButtonText(actionType)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
