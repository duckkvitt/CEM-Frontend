import { DEVICE_SERVICE_URL } from './api'
import { getValidAccessToken, logout } from './auth'
import { handleApiError } from './error-utils'

export interface Task {
  id: number
  taskId: string
  serviceRequestId?: number
  customerDeviceId: number
  customerName?: string
  deviceName: string
  deviceModel?: string
  serialNumber?: string
  title: string
  description: string
  type: 'MAINTENANCE' | 'WARRANTY' | 'INSTALLATION' | 'REPAIR' | 'INSPECTION'
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  preferredCompletionDate?: string
  estimatedCost?: number
  actualCost?: number
  attachments?: string[]
  staffNotes?: string
  assignedToId?: number
  assignedToName?: string
  assignedById?: number
  assignedByName?: string
  rejectedReason?: string
  completedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  history?: TaskHistory[]
  sparePartsUsed?: SparePartUsage[]
}

export interface TaskHistory {
  id: number
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  comment?: string
  updatedBy: string
  createdAt: string
}

export interface TaskStatistics {
  totalTasks: number
  pendingTasks: number
  assignedTasks: number
  acceptedTasks: number
  inProgressTasks: number
  completedTasks: number
  rejectedTasks: number
  highPriorityTasks: number
  criticalPriorityTasks: number
  overdueTasks: number
  completionRate: number
  rejectionRate: number
}

export interface TechnicianWorkSchedule {
  taskId: number
  taskNumber: string
  title: string
  type: string
  status: string
  priority: string
  scheduledDate?: string
  estimatedDurationHours?: number
  serviceLocation?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  deviceName?: string
  deviceModel?: string
  serialNumber?: string
  description: string
  createdAt: string
}

export interface CreateTaskRequest {
  customerDeviceId: number
  title: string
  description: string
  type: 'MAINTENANCE' | 'WARRANTY' | 'INSTALLATION' | 'REPAIR' | 'INSPECTION'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  preferredCompletionDate?: string
  estimatedCost?: number
  attachments?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  type?: 'MAINTENANCE' | 'WARRANTY' | 'INSTALLATION' | 'REPAIR' | 'INSPECTION'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  preferredCompletionDate?: string
  estimatedCost?: number
  actualCost?: number
  attachments?: string[]
  staffNotes?: string
}

export interface ApproveServiceRequestRequest {
  taskTitle: string
  additionalNotes?: string
  taskType?: 'MAINTENANCE' | 'WARRANTY' | 'INSTALLATION' | 'REPAIR' | 'INSPECTION'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  scheduledDate?: string
  estimatedDurationHours?: number
  serviceLocation?: string
  customerContactInfo?: string
  supportNotes?: string
}

export interface RejectServiceRequestRequest {
  rejectedReason: string
}

export interface AssignTaskRequest {
  assignedToId: number
  estimatedCost?: number
  staffNotes?: string
}

export interface TaskActionRequest {
  comment?: string
  actualCost?: number
  attachments?: string[]
}

export interface TechnicianInfo {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
  specializations?: string[]
  currentTaskCount: number
  maxTaskCapacity: number
  isAvailable: boolean
}

export interface SparePartUsage {
  id: number
  taskId: number
  sparePartId: number
  sparePartName: string
  sparePartCode?: string
  quantityUsed: number
  unitPrice: number
  totalCost: number
  notes?: string
  usedAt: string
  createdBy: string
}

export interface ExportSparePartRequest {
  taskId: number
  sparePartId: number
  quantityUsed: number
  unitPrice?: number
  notes?: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// Helper function for authenticated requests
async function authenticatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getValidAccessToken()
  if (!token) {
    await logout()
    throw new Error('Authentication failed - Please log in again')
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle token expiration specifically
  if (response.status === 401) {
    console.log('401 Unauthorized - token may be expired, logging out')
    await logout()
    throw new Error('Session expired - Please log in again')
  }

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json()
}

// Task Management Functions

export async function createTask(request: CreateTaskRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return result.data
}

export async function getAllTasks(params: {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
  status?: string
} = {}): Promise<Page<Task>> {
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortDir) searchParams.set('sortDir', params.sortDir)
  if (params.status) searchParams.set('status', params.status)

  const result = await authenticatedFetch<{ data: Page<Task> }>(`${DEVICE_SERVICE_URL}/api/tasks?${searchParams}`)
  return result.data
}

export async function getTaskById(taskId: number): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}`)
  return result.data
}

export async function updateTask(taskId: number, request: UpdateTaskRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(request)
  })
  return result.data
}

export async function deleteTask(taskId: number): Promise<void> {
  await authenticatedFetch<void>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}`, {
    method: 'DELETE'
  })
}

export async function getMyTasks(params: {
  search?: string
  status?: string
  type?: string
  priority?: string
  page?: number
  size?: number
} = {}): Promise<Page<Task>> {
  const searchParams = new URLSearchParams()
  
  if (params.search) searchParams.set('search', params.search)
  if (params.status) searchParams.set('status', params.status)
  if (params.type) searchParams.set('type', params.type)
  if (params.priority) searchParams.set('priority', params.priority)
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())

  const result = await authenticatedFetch<{ data: Page<Task> }>(`${DEVICE_SERVICE_URL}/api/tasks/my-tasks?${searchParams}`)
  return result.data
}

// Service Request Approval/Rejection Functions

export async function approveServiceRequest(serviceRequestId: number, request: ApproveServiceRequestRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/service-requests/${serviceRequestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return result.data
}

export async function rejectServiceRequest(serviceRequestId: number, request: RejectServiceRequestRequest): Promise<void> {
  await authenticatedFetch<void>(`${DEVICE_SERVICE_URL}/api/tasks/service-requests/${serviceRequestId}/reject`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

// TechLead Functions

export async function assignTask(taskId: number, request: AssignTaskRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/assign`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return result.data
}

export async function getTasksForAssignment(params: {
  search?: string
  type?: string
  priority?: string
  status?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
} = {}): Promise<Page<Task>> {
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.type) searchParams.set('type', params.type)
  if (params.priority) searchParams.set('priority', params.priority)
  if (params.status) searchParams.set('status', params.status)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortDir) searchParams.set('sortDir', params.sortDir)

  const result = await authenticatedFetch<{ data: Page<Task> }>(`${DEVICE_SERVICE_URL}/api/tasks/for-assignment?${searchParams}`)
  return result.data
}

export async function acceptTask(taskId: number, request?: TaskActionRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/accept`, {
    method: 'POST',
    body: request ? JSON.stringify(request) : undefined
  })
  return result.data
}

export async function rejectTask(taskId: number, request: TaskActionRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/reject`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return result.data
}

export async function startTask(taskId: number, request?: TaskActionRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/start`, {
    method: 'POST',
    body: request ? JSON.stringify(request) : undefined
  })
  return result.data
}

export async function completeTask(taskId: number, request?: TaskActionRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/complete`, {
    method: 'POST',
    body: request ? JSON.stringify(request) : undefined
  })
  return result.data
}

export async function getMyAvailableTasks(params: {
  search?: string
  type?: string
  priority?: string
  status?: string
  sortBy?: string
  sortOrder?: string
} = {}): Promise<Task[]> {
  const searchParams = new URLSearchParams()
  
  if (params.search) searchParams.set('search', params.search)
  if (params.type) searchParams.set('type', params.type)
  if (params.priority) searchParams.set('priority', params.priority)
  if (params.status) searchParams.set('status', params.status)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const result = await authenticatedFetch<{ data: Task[] }>(`${DEVICE_SERVICE_URL}/api/tasks/my-available?${searchParams}`)
  return result.data
}

export async function updateTaskStatus(taskId: number, request: TaskActionRequest): Promise<Task> {
  const result = await authenticatedFetch<{ data: Task }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify(request)
  })
  return result.data
}

export async function getTechnicianWorkSchedule(params: {
  technicianId?: number
  startDate?: string
  endDate?: string
} = {}): Promise<TechnicianWorkSchedule[]> {
  const searchParams = new URLSearchParams()
  
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  if (params.technicianId !== undefined) searchParams.set('technicianId', params.technicianId.toString())

  const result = await authenticatedFetch<{ data: TechnicianWorkSchedule[] }>(`${DEVICE_SERVICE_URL}/api/tasks/technician-schedule?${searchParams}`)
  return result.data
}

export async function getTechniciansForAssignment(): Promise<TechnicianInfo[]> {
  const result = await authenticatedFetch<{ data: TechnicianInfo[] }>(`${DEVICE_SERVICE_URL}/api/tasks/technicians`)
  return result.data
}

export async function initializeTechnicianProfiles(): Promise<{ message: string; status: string }> {
  const result = await authenticatedFetch<{ message: string; status: string }>(`${DEVICE_SERVICE_URL}/api/tasks/technicians/initialize-profiles`, {
    method: 'POST'
  })
  return result
}

// Statistics

export async function getTaskStatistics(): Promise<TaskStatistics> {
  const result = await authenticatedFetch<{ data: TaskStatistics }>(`${DEVICE_SERVICE_URL}/api/tasks/statistics`)
  return result.data
}

// Spare Parts Export Functions

export async function exportSparePartForTask(request: ExportSparePartRequest): Promise<any> {
  console.log('ExportSparePartRequest:', request)
  
  const result = await authenticatedFetch<any>(`${DEVICE_SERVICE_URL}/api/tasks/${request.taskId}/spare-parts/export`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  
  console.log('Export result:', result)
  return result
}

export async function getTaskSparePartsUsed(taskId: number): Promise<SparePartUsage[]> {
  console.log('Fetching spare parts usage for taskId:', taskId)
  
  const result = await authenticatedFetch<{ data: SparePartUsage[] }>(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/spare-parts`)
  return result.data
}