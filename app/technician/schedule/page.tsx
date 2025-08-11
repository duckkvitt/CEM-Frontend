'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Wrench, 
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  Square,
  AlertCircle,
  DollarSign,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { getCurrentUserRole } from '@/lib/auth'
import { 
  getTechnicianWorkSchedule,
  getMyTasks,
  acceptTask,
  rejectTask,
  startTask,
  completeTask,
  getTaskById,
  TechnicianWorkSchedule,
  Task,
  TaskActionRequest,
  Page
} from '@/lib/task-service'

const STATUS_COLORS = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
}

const STATUS_ICONS = {
  ASSIGNED: Clock,
  ACCEPTED: CheckCircle,
  IN_PROGRESS: Wrench,
  COMPLETED: CheckCircle,
  REJECTED: XCircle
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

export default function TechnicianSchedulePage() {
  const [workSchedule, setWorkSchedule] = useState<TechnicianWorkSchedule[]>([])
  const [myTasks, setMyTasks] = useState<Page<Task> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'start' | 'complete'>('accept')
  const [submitting, setSubmitting] = useState(false)
  const [actionForm, setActionForm] = useState<TaskActionRequest>({
    comment: '',
    rejectionReason: ''
  })

  // Date range for schedule view
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
  })

  const router = useRouter()

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && role !== 'TECHNICIAN') {
      router.replace('/dashboard')
    }
  }, [role, router])

  useEffect(() => {
    if (role === 'TECHNICIAN') {
      fetchData()
    }
  }, [role, dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch work schedule
      const scheduleData = await getTechnicianWorkSchedule({
        startDate: dateRange.startDate + 'T00:00:00',
        endDate: dateRange.endDate + 'T23:59:59'
      })
      setWorkSchedule(scheduleData)
      
      // Fetch my tasks
      const tasksData = await getMyTasks({
        page: 0,
        size: 20,
        sortBy: 'scheduledDate',
        sortDir: 'asc'
      })
      setMyTasks(tasksData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch schedule'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskAction = (task: Task, action: 'accept' | 'reject' | 'start' | 'complete') => {
    setSelectedTask(task)
    setActionType(action)
    setActionForm({
      comment: '',
      rejectionReason: ''
    })
    setActionModalOpen(true)
  }

  const submitTaskAction = async () => {
    if (!selectedTask) return
    
    setSubmitting(true)
    try {
      switch (actionType) {
        case 'accept':
          await acceptTask(selectedTask.id, actionForm)
          break
        case 'reject':
          await rejectTask(selectedTask.id, actionForm)
          break
        case 'start':
          await startTask(selectedTask.id, actionForm)
          break
        case 'complete':
          await completeTask(selectedTask.id, actionForm)
          break
      }
      
      setActionModalOpen(false)
      setSelectedTask(null)
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to ${actionType} task`
      setError(msg)
    } finally {
      setSubmitting(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock
    return <Icon className="h-4 w-4" />
  }

  const groupScheduleByDate = (schedule: TechnicianWorkSchedule[]) => {
    const grouped: { [key: string]: TechnicianWorkSchedule[] } = {}
    
    schedule.forEach(item => {
      if (item.scheduledDate) {
        const date = new Date(item.scheduledDate).toISOString().split('T')[0]
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(item)
      }
    })

    // Sort items within each day by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      })
    })

    return grouped
  }

  const getTaskActions = (task: Task) => {
    const actions = []
    
    if (task.status === 'ASSIGNED') {
      actions.push(
        <Button
          key="accept"
          variant="outline"
          size="sm"
          onClick={() => handleTaskAction(task, 'accept')}
          className="text-green-600 hover:text-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Accept
        </Button>,
        <Button
          key="reject"
          variant="outline"
          size="sm"
          onClick={() => handleTaskAction(task, 'reject')}
          className="text-red-600 hover:text-red-700"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Reject
        </Button>
      )
    } else if (task.status === 'ACCEPTED') {
      actions.push(
        <Button
          key="start"
          variant="outline"
          size="sm"
          onClick={() => handleTaskAction(task, 'start')}
          className="text-blue-600 hover:text-blue-700"
        >
          <Play className="h-4 w-4 mr-1" />
          Start Work
        </Button>
      )
    } else if (task.status === 'IN_PROGRESS') {
      actions.push(
        <Button
          key="complete"
          variant="outline"
          size="sm"
          onClick={() => handleTaskAction(task, 'complete')}
          className="text-green-600 hover:text-green-700"
        >
          <Square className="h-4 w-4 mr-1" />
          Complete
        </Button>
      )
    }

    actions.push(
      <Button
        key="view"
        variant="outline"
        size="sm"
        onClick={() => handleViewTask(task)}
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
    )

    return actions
  }

  if (role && role !== 'TECHNICIAN') {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-5 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 border rounded">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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

  const groupedSchedule = groupScheduleByDate(workSchedule)
  const sortedDates = Object.keys(groupedSchedule).sort()

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Work Schedule</h1>
            <p className="text-gray-600">
              View your assigned tasks and manage your work schedule
            </p>
          </div>
          <Button onClick={() => router.push('/technician/tasks')} variant="outline">
            View All Tasks
          </Button>
        </div>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <Button onClick={fetchData}>Update Schedule</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule View */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Schedule
              </CardTitle>
              <CardDescription>
                {workSchedule.length} task{workSchedule.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedDates.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled tasks</h3>
                  <p className="text-gray-600">
                    No tasks are scheduled for the selected date range.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedDates.map(date => (
                    <div key={date}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
                        {new Date(date).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <div className="space-y-3">
                        {groupedSchedule[date].map(item => (
                          <motion.div
                            key={item.taskId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-lg">{item.title}</h4>
                                  <Badge className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}>
                                    {getStatusIcon(item.status)}
                                    {item.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS]}>
                                    {item.priority}
                                  </Badge>
                                  <Badge className={TYPE_COLORS[item.type as keyof typeof TYPE_COLORS]}>
                                    {item.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  <div className="space-y-2">
                                    {item.scheduledDate && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        {formatTime(item.scheduledDate)}
                                        {item.estimatedDurationHours && ` (${item.estimatedDurationHours}h)`}
                                      </div>
                                    )}
                                    {item.serviceLocation && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        {item.serviceLocation}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Wrench className="h-4 w-4" />
                                      {item.deviceName} {item.deviceModel && `(${item.deviceModel})`}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {item.customerName && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="h-4 w-4" />
                                        {item.customerName}
                                      </div>
                                    )}
                                    {item.customerPhone && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="h-4 w-4" />
                                        {item.customerPhone}
                                      </div>
                                    )}
                                    {item.customerEmail && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="h-4 w-4" />
                                        {item.customerEmail}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-gray-700 mt-2 text-sm line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Actions Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Pending Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Actions Required
              </CardTitle>
              <CardDescription>Tasks that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {myTasks?.content.filter(task => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.status)).length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks?.content
                    .filter(task => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(task.status))
                    .slice(0, 5)
                    .map(task => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm line-clamp-1">{task.title}</h5>
                          <Badge className={STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]} variant="outline">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                          {task.deviceName}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {getTaskActions(task)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assigned Tasks</span>
                  <Badge variant="secondary">
                    {myTasks?.content.filter(t => t.status === 'ASSIGNED').length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <Badge variant="secondary">
                    {myTasks?.content.filter(t => t.status === 'IN_PROGRESS').length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Today</span>
                  <Badge variant="secondary">
                    {myTasks?.content.filter(t => 
                      t.status === 'COMPLETED' && 
                      t.completedAt && 
                      new Date(t.completedAt).toDateString() === new Date().toDateString()
                    ).length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <Badge variant="secondary">
                    {myTasks?.totalElements || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Task Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' && 'Accept Task'}
              {actionType === 'reject' && 'Reject Task'}
              {actionType === 'start' && 'Start Work'}
              {actionType === 'complete' && 'Complete Task'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept' && 'Confirm that you accept this task assignment.'}
              {actionType === 'reject' && 'Please provide a reason for rejecting this task.'}
              {actionType === 'start' && 'Start working on this task.'}
              {actionType === 'complete' && 'Mark this task as completed and provide completion notes.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {actionType === 'reject' ? (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="rejection-reason" className="text-right">
                  Rejection Reason
                </Label>
                <Textarea
                  id="rejection-reason"
                  value={actionForm.rejectionReason}
                  onChange={(e) => setActionForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  className="col-span-3"
                  rows={4}
                  placeholder="Explain why you cannot accept this task..."
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="comment" className="text-right">
                  {actionType === 'complete' ? 'Completion Notes' : 'Comments'}
                </Label>
                <Textarea
                  id="comment"
                  value={actionForm.comment}
                  onChange={(e) => setActionForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="col-span-3"
                  rows={3}
                  placeholder={
                    actionType === 'complete' 
                      ? 'Describe the work completed, any issues encountered, or additional notes...'
                      : 'Add any comments or notes (optional)...'
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitTaskAction} 
              disabled={submitting || (actionType === 'reject' && !actionForm.rejectionReason.trim())}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {submitting ? (
                actionType === 'accept' ? 'Accepting...' :
                actionType === 'reject' ? 'Rejecting...' :
                actionType === 'start' ? 'Starting...' : 'Completing...'
              ) : (
                actionType === 'accept' ? 'Accept Task' :
                actionType === 'reject' ? 'Reject Task' :
                actionType === 'start' ? 'Start Work' : 'Complete Task'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <Badge className={`ml-2 ${STATUS_COLORS[selectedTask.status]}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={`ml-2 ${PRIORITY_COLORS[selectedTask.priority]}`}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge className={`ml-2 ${TYPE_COLORS[selectedTask.type]}`}>
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
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTask.history.map((entry, index) => (
                      <div key={entry.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={STATUS_COLORS[entry.status]}>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
