import { DEVICE_SERVICE_URL } from './api'
import { getAccessToken } from './auth'

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
  title: string
  description: string
  type: string
  priority?: string
  customerDeviceId: number
  preferredCompletionDate?: string
  estimatedCost?: number
  staffNotes?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  type?: string
  priority?: string
  estimatedCost?: number
  staffNotes?: string
}

export interface AssignTaskRequest {
  technicianId: number
  scheduledDate?: string
  techleadNotes?: string
}

export interface TaskActionRequest {
  comment?: string
  actualCost?: number
}

export interface ApproveServiceRequestRequest {
  taskTitle: string
  additionalNotes?: string
  taskType?: string
  priority?: string
  scheduledDate?: string
  estimatedDurationHours?: number
  serviceLocation?: string
  customerContactInfo?: string
  estimatedCost?: number
  supportNotes?: string
}

export interface RejectServiceRequestRequest {
  rejectionReason: string
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

// Task Management Functions

export async function createTask(request: CreateTaskRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create task')
  }

  const result = await response.json()
  return result.data
}

export async function getAllTasks(params: {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
  status?: string
} = {}): Promise<Page<Task>> {
  const token = getAccessToken()
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortDir) searchParams.set('sortDir', params.sortDir)
  if (params.status) searchParams.set('status', params.status)

  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  const result = await response.json()
  return result.data
}

export async function getTaskById(taskId: number): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch task')
  }

  const result = await response.json()
  return result.data
}

export async function updateTask(taskId: number, request: UpdateTaskRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update task')
  }

  const result = await response.json()
  return result.data
}

export async function deleteTask(taskId: number): Promise<void> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete task')
  }
}

export async function getAllTasksForStaff(params: {
  search?: string
  status?: string
  priority?: string
  type?: string
  sortBy?: string
  sortOrder?: string
  page?: number
  size?: number
} = {}): Promise<Page<Task>> {
  const token = getAccessToken()
  const searchParams = new URLSearchParams()
  
  if (params.search) searchParams.set('search', params.search)
  if (params.status) searchParams.set('status', params.status)
  if (params.priority) searchParams.set('priority', params.priority)
  if (params.type) searchParams.set('type', params.type)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())

  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/staff?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch tasks for staff')
  }

  const result = await response.json()
  return result.data
}

// Service Request Approval/Rejection Functions

export async function approveServiceRequest(serviceRequestId: number, request: ApproveServiceRequestRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/service-requests/${serviceRequestId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to approve service request')
  }

  const result = await response.json()
  return result.data
}

export async function rejectServiceRequest(serviceRequestId: number, request: RejectServiceRequestRequest): Promise<void> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/service-requests/${serviceRequestId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to reject service request')
  }
}

// TechLead Functions

export async function assignTask(taskId: number, request: AssignTaskRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/assign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to assign task')
  }

  const result = await response.json()
  return result.data
}

// Technician Functions

export async function getMyTasks(params: {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
  status?: string
} = {}): Promise<Page<Task>> {
  const token = getAccessToken()
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortDir) searchParams.set('sortDir', params.sortDir)
  if (params.status) searchParams.set('status', params.status)

  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/my-tasks?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch my tasks')
  }

  const result = await response.json()
  return result.data
}

export async function acceptTask(taskId: number, request?: TaskActionRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request || {})
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to accept task')
  }

  const result = await response.json()
  return result.data
}

export async function rejectTask(taskId: number, request: TaskActionRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to reject task')
  }

  const result = await response.json()
  return result.data
}

export async function startTask(taskId: number, request?: TaskActionRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request || {})
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to start task')
  }

  const result = await response.json()
  return result.data
}

export async function completeTask(taskId: number, request?: TaskActionRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request || {})
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to complete task')
  }

  const result = await response.json()
  return result.data
}

export async function getTasksForTechnician(technicianId: number, params: {
  search?: string
  status?: string
  priority?: string
  type?: string
  sortBy?: string
  sortOrder?: string
} = {}): Promise<Task[]> {
  const token = getAccessToken()
  const searchParams = new URLSearchParams()
  
  if (params.search) searchParams.set('search', params.search)
  if (params.status) searchParams.set('status', params.status)
  if (params.priority) searchParams.set('priority', params.priority)
  if (params.type) searchParams.set('type', params.type)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/technician/${technicianId}?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch technician tasks')
  }

  const result = await response.json()
  return result.data
}

export async function updateTaskStatus(taskId: number, request: TaskActionRequest): Promise<Task> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update task status')
  }

  const result = await response.json()
  return result.data
}

export async function getTechnicianWorkSchedule(params: {
  startDate?: string
  endDate?: string
} = {}): Promise<TechnicianWorkSchedule[]> {
  const token = getAccessToken()
  const searchParams = new URLSearchParams()
  
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)

  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/my-schedule?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch work schedule')
  }

  const result = await response.json()
  return result.data
}

// TechLead - Technician Management

export interface TechnicianInfo {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  currentTaskCount: number
  totalTaskCount: number
  completedTaskCount: number
  averageRating: number
  isAvailable: boolean
  workloadPercentage: number
  availabilityStatus: string // AVAILABLE, BUSY, OVERLOADED, UNAVAILABLE
  maxConcurrentTasks: number
  skills?: string
  location?: string
  completionRate: number
  averageCompletionDays: number
  lastActiveDate?: string
}

export async function getTechniciansForAssignment(): Promise<TechnicianInfo[]> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/technicians`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch technicians for assignment')
  }

  const result = await response.json()
  return result.data
}

export async function initializeTechnicianProfiles(): Promise<{ message: string; status: string }> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/technicians/initialize-profiles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    throw new Error('Failed to initialize technician profiles')
  }

  const result = await response.json()
  return result.data
}

// Statistics

export async function getTaskStatistics(): Promise<TaskStatistics> {
  const token = getAccessToken()
  const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/statistics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch task statistics')
  }

  const result = await response.json()
  return result.data
}

export interface SparePartUsage {
  id: number
  sparePartId: number
  partName: string
  partCode: string
  quantity: number
  unitCost: number
  totalCost: number
  exportedAt: string
  exportedBy: string
  notes?: string
}

export interface ExportSparePartRequest {
  taskId: number
  sparePartId: number
  quantity: number
  notes?: string
  warehouseLocation?: string
}

// Spare Parts Export Functions
export async function exportSparePartForTask(request: ExportSparePartRequest): Promise<any> {
  const token = getAccessToken()
  
  // Debug log để kiểm tra request
  console.log('ExportSparePartRequest:', request)
  
  const exportRequest = {
    itemType: 'SPARE_PART' as const,
    items: [{
      itemId: request.sparePartId,
      quantity: request.quantity,
      notes: request.notes
    }],
    referenceType: 'TASK',
    referenceId: Number(request.taskId),
    notes: request.notes,
    warehouseLocation: request.warehouseLocation || 'Main Warehouse'
  }
  
  // Debug log để kiểm tra exportRequest
  console.log('Backend exportRequest:', exportRequest)

  const response = await fetch(`${DEVICE_SERVICE_URL}/api/v1/inventory/export`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exportRequest)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to export spare part')
  }

  const result = await response.json()
  return result.data
}

export async function getTaskSparePartsUsed(taskId: number): Promise<SparePartUsage[]> {
  const token = getAccessToken()
  
  // Debug log để kiểm tra taskId
  console.log('Fetching spare parts usage for taskId:', taskId)
  
  const url = `${DEVICE_SERVICE_URL}/api/v1/inventory/transactions?referenceType=TASK&referenceId=${taskId}&transactionType=EXPORT&itemType=SPARE_PART`
  console.log('API URL:', url)
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('API response not ok:', response.status, errorText)
    throw new Error('Failed to fetch task spare parts usage')
  }

  const result = await response.json()
  console.log('API response result:', result)
  console.log('API response data:', result.data)
  console.log('API response data type:', typeof result.data)
  console.log('API response data isArray:', Array.isArray(result.data))
  if (Array.isArray(result.data)) {
    console.log('First few transactions:', result.data.slice(0, 3))
  }
  
  // Check if data is directly an array or has content property
  let transactions: any[] = []
  if (Array.isArray(result.data)) {
    // Data is directly an array
    transactions = result.data
    console.log('Data is directly an array, length:', transactions.length)
  } else if (result.data?.content && Array.isArray(result.data.content)) {
    // Data has content property
    transactions = result.data.content
    console.log('Data has content property, length:', transactions.length)
  } else {
    console.log('Unexpected data structure:', result.data)
    return []
  }
  
  // Filter only EXPORT transactions for SPARE_PART with matching referenceId
  const exportTransactions = transactions.filter((transaction: any) => {
    const matches = transaction.transactionType === 'EXPORT' &&
      transaction.itemType === 'SPARE_PART' &&
      transaction.referenceType === 'TASK' &&
      Number(transaction.referenceId) === Number(taskId)
    
    if (matches) {
      console.log('Found matching transaction:', transaction)
    }
    
    return matches
  })
  
  console.log('Filtered export transactions:', exportTransactions)
  
  const sparePartUsages: SparePartUsage[] = exportTransactions.map((transaction: any) => ({
    id: transaction.id,
    sparePartId: transaction.itemId,
    partName: transaction.itemName,
    partCode: transaction.itemName, // Fallback, có thể cần lấy từ spare part service
    quantity: transaction.quantity,
    unitCost: transaction.unitPrice || 0,
    totalCost: (transaction.unitPrice || 0) * transaction.quantity,
    exportedAt: transaction.createdAt,
    exportedBy: transaction.createdBy,
    notes: transaction.notes
  }))
  
  console.log('Transformed sparePartUsages:', sparePartUsages)
  return sparePartUsages
}
