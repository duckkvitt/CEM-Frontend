'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserRole, extractUserIdFromToken } from '@/lib/auth'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Clock, 
  Calendar, 
  User, 
  MapPin,
  AlertCircle,
  FileText,
  DollarSign,
  Loader2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { 
  Task, 
  TaskActionRequest,
  Page,
  getMyTasks,
  acceptTask,
  rejectTask,
  updateTaskStatus,
  completeTask,
  getTaskById
} from '@/lib/task-service'

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
  const [sortBy, setSortBy] = useState('preferredCompletionDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [activeTab, setActiveTab] = useState('assigned')

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'start' | 'complete' | 'update'>('accept')

  // Form states
  const [actionComment, setActionComment] = useState('')
  const [actualCost, setActualCost] = useState<number>(0)

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
  }, [technicianId, searchTerm, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder])

  const loadTasks = async () => {
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
  }

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
    setStatusFilter('')
    setPriorityFilter('')
    setTypeFilter('')
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

  const canAcceptTask = (task: Task) => task.status === 'ASSIGNED'
  const canRejectTask = (task: Task) => task.status === 'ASSIGNED'
  const canStartTask = (task: Task) => task.status === 'ASSIGNED'
  const canCompleteTask = (task: Task) => task.status === 'IN_PROGRESS'
  const canUpdateTask = (task: Task) => task.status === 'IN_PROGRESS'

  const getActionButtonText = (action: typeof actionType) => {
    switch (action) {
      case 'accept': return 'Accept Task'
      case 'reject': return 'Reject Task'
      case 'start': return 'Start Work'
      case 'complete': return 'Complete Task'
      case 'update': return 'Update Status'
      default: return 'Action'
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex min-h-screen w-full">
        <main className="ml-64 flex-1 bg-background p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const filteredTasks = getFilteredTasks()

  return (
    <div className="flex min-h-screen w-full">
      <main className="ml-64 flex-1 bg-background p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
              <p className="text-muted-foreground">
                Manage your assigned tasks and track your work progress
              </p>
            </div>
          </div>

          {/* Task Status Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assigned" className="gap-2">
                <Clock className="h-4 w-4" />
                Assigned ({tasks.filter(t => t.status === 'ASSIGNED').length})
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                <Play className="h-4 w-4" />
                Active ({tasks.filter(t => t.status === 'IN_PROGRESS').length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed ({tasks.filter(t => t.status === 'COMPLETED').length})
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <FileText className="h-4 w-4" />
                All ({tasks.length})
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        <SelectItem value="preferredCompletionDate">Due Date</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
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

            {/* Tasks Content */}
            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </>
              ) : filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                    <p className="text-muted-foreground text-center">
                      {activeTab === 'assigned' && "You don't have any assigned tasks at the moment."}
                      {activeTab === 'active' && "You don't have any active tasks at the moment."}
                      {activeTab === 'completed' && "You haven't completed any tasks yet."}
                      {activeTab === 'all' && "No tasks match your current filters."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTasks.map((task, index) => (
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
                              {task.preferredCompletionDate && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>Due: {format(new Date(task.preferredCompletionDate), 'MMM dd, yyyy')}</span>
                                </div>
                              )}
                              {task.estimatedCost && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span>Est: ${task.estimatedCost}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTask(task)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>

                            {/* Action Buttons based on task status */}
                            {canAcceptTask(task) && (
                              <Button
                                size="sm"
                                onClick={() => openActionModal(task, 'accept')}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                              >
                                <ThumbsUp className="h-4 w-4" />
                                Accept
                              </Button>
                            )}

                            {canRejectTask(task) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionModal(task, 'reject')}
                                className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              >
                                <ThumbsDown className="h-4 w-4" />
                                Reject
                              </Button>
                            )}

                            {canStartTask(task) && (
                              <Button
                                size="sm"
                                onClick={() => openActionModal(task, 'start')}
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                              >
                                <Play className="h-4 w-4" />
                                Start
                              </Button>
                            )}

                            {canUpdateTask(task) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionModal(task, 'update')}
                                className="gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                Update
                              </Button>
                            )}

                            {canCompleteTask(task) && (
                              <Button
                                size="sm"
                                onClick={() => openActionModal(task, 'complete')}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* View Task Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
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
                  {selectedTask.deviceModel && (
                    <div>
                      <Label className="text-sm font-medium">Device Model</Label>
                      <p className="text-sm text-muted-foreground">{selectedTask.deviceModel}</p>
                    </div>
                  )}
                  {selectedTask.serialNumber && (
                    <div>
                      <Label className="text-sm font-medium">Serial Number</Label>
                      <p className="text-sm text-muted-foreground">{selectedTask.serialNumber}</p>
                    </div>
                  )}
                </div>

                {selectedTask.preferredCompletionDate && (
                  <div>
                    <Label className="text-sm font-medium">Preferred Completion Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedTask.preferredCompletionDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}

                {(selectedTask.estimatedCost || selectedTask.actualCost) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTask.estimatedCost && (
                      <div>
                        <Label className="text-sm font-medium">Estimated Cost</Label>
                        <p className="text-sm text-muted-foreground">${selectedTask.estimatedCost}</p>
                      </div>
                    )}
                    {selectedTask.actualCost && (
                      <div>
                        <Label className="text-sm font-medium">Actual Cost</Label>
                        <p className="text-sm text-muted-foreground">${selectedTask.actualCost}</p>
                      </div>
                    )}
                  </div>
                )}

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
                    <div className="space-y-3 max-h-40 overflow-y-auto border rounded-lg bg-muted/20 p-2">
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
