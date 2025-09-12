import { DEVICE_SERVICE_URL } from './api'
import { getValidAccessToken, logout } from './auth'
import { handleApiError } from './error-utils'

export interface ServiceRequest {
  id: number
  requestId: string
  customerId: number
  deviceId: number
  deviceName: string
  deviceModel?: string
  serialNumber?: string
  type: 'MAINTENANCE' | 'WARRANTY'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED'
  description: string
  preferredDateTime?: string
  staffNotes?: string
  customerComments?: string
  workLocation?: string
  completedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  history?: ServiceRequestHistory[]
}

export interface ServiceRequestHistory {
  id: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED'
  comment: string
  updatedBy: string
  createdAt: string
}

export interface ServiceRequestStatistics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  inProgressRequests: number
  completedRequests: number
  maintenanceRequests: number
  warrantyRequests: number
}

export interface CreateServiceRequestRequest {
  deviceId: number
  type: 'MAINTENANCE' | 'WARRANTY'
  description: string
  preferredDateTime?: string
  workLocation?: string
  customerComments?: string
}

export interface UpdateServiceRequestRequest {
  description?: string
  preferredDateTime?: string
  workLocation?: string
  customerComments?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/**
 * Helper function to handle error responses
 */
async function handleErrorResponse(response: Response): Promise<never> {
  await handleApiError(response);
}

// Helper function for authenticated requests
async function authenticatedFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidAccessToken()
  if (!token) {
    await logout()
    throw new Error('Authentication failed - Please log in again')
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
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
    await handleErrorResponse(response)
  }

  const data: ApiResponse<T> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Request failed')
  }
  
  return data.data
}

/**
 * Create a new service request
 */
export async function createServiceRequest(request: CreateServiceRequestRequest): Promise<ServiceRequest> {
  return await authenticatedFetch<ServiceRequest>(`${DEVICE_SERVICE_URL}/api/service-requests`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

/**
 * Get service request by ID
 */
export async function getServiceRequestById(id: number): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/${id}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequest> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service request')
  }
  
  return data.data
}

/**
 * Get service request by request ID
 */
export async function getServiceRequestByRequestId(requestId: string): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/by-request-id/${requestId}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequest> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service request')
  }
  
  return data.data
}

/**
 * Get customer's service requests with pagination and filtering
 */
export async function getCustomerServiceRequests(params: {
  keyword?: string
  status?: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED'
  type?: 'MAINTENANCE' | 'WARRANTY'
  deviceId?: number
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}): Promise<Page<ServiceRequest>> {
  const searchParams = new URLSearchParams()
  
  if (params.keyword) searchParams.append('keyword', params.keyword)
  if (params.status) searchParams.append('status', params.status)
  if (params.type) searchParams.append('type', params.type)
  if (params.deviceId) searchParams.append('deviceId', params.deviceId.toString())
  if (params.page !== undefined) searchParams.append('page', params.page.toString())
  if (params.size !== undefined) searchParams.append('size', params.size.toString())
  if (params.sortBy) searchParams.append('sortBy', params.sortBy)
  if (params.sortDir) searchParams.append('sortDir', params.sortDir)
  
  const url = `${DEVICE_SERVICE_URL}/api/service-requests?${searchParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<Page<ServiceRequest>> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service requests')
  }
  
  return data.data
}

/**
 * Update service request
 */
export async function updateServiceRequest(id: number, request: UpdateServiceRequestRequest): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/${id}`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequest> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to update service request')
  }
  
  return data.data
}

/**
 * Add comment to service request
 */
export async function addComment(id: number, comment: string): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/${id}/comments`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment })
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequest> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to add comment')
  }
  
  return data.data
}

/**
 * Get service request statistics
 */
export async function getServiceRequestStatistics(): Promise<ServiceRequestStatistics> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/statistics`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequestStatistics> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch statistics')
  }
  
  return data.data
}

/**
 * Get service requests by device ID
 */
export async function getServiceRequestsByDevice(deviceId: number, params: {
  page?: number
  size?: number
}): Promise<Page<ServiceRequest>> {
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.append('page', params.page.toString())
  if (params.size !== undefined) searchParams.append('size', params.size.toString())
  
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/device/${deviceId}?${searchParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<Page<ServiceRequest>> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch device service requests')
  }
  
  return data.data
}

/**
 * Get service requests by type
 */
export async function getServiceRequestsByType(type: 'MAINTENANCE' | 'WARRANTY', params: {
  page?: number
  size?: number
}): Promise<Page<ServiceRequest>> {
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.append('page', params.page.toString())
  if (params.size !== undefined) searchParams.append('size', params.size.toString())
  
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/type/${type}?${searchParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<Page<ServiceRequest>> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service requests by type')
  }
  
  return data.data
}

/**
 * Get service requests by status
 */
export async function getServiceRequestsByStatus(status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED', params: {
  page?: number
  size?: number
}): Promise<Page<ServiceRequest>> {
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.append('page', params.page.toString())
  if (params.size !== undefined) searchParams.append('size', params.size.toString())
  
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/status/${status}?${searchParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<Page<ServiceRequest>> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service requests by status')
  }
  
  return data.data
}

// ========== Staff Functions ==========

/**
 * Get all service requests for staff (Support Team, Manager, Admin)
 */
export async function getAllServiceRequestsForStaff(params: {
  keyword?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED'
  type?: 'MAINTENANCE' | 'WARRANTY'
  customerId?: number
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
} = {}): Promise<Page<ServiceRequest>> {
  const searchParams = new URLSearchParams()
  
  if (params.keyword) searchParams.set('keyword', params.keyword)
  if (params.status) searchParams.set('status', params.status)
  if (params.type) searchParams.set('type', params.type)
  if (params.customerId) searchParams.set('customerId', params.customerId.toString())
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortDir) searchParams.set('sortDir', params.sortDir)

  const url = `${DEVICE_SERVICE_URL}/api/service-requests/all?${searchParams}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<Page<ServiceRequest>> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service requests')
  }
  
  return data.data
}

/**
 * Get service request by ID for staff
 */
export async function getServiceRequestByIdForStaff(id: number): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/staff/${id}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequest> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service request')
  }
  
  return data.data
}

/**
 * Get pending service requests for Support Team
 */
export async function getPendingServiceRequests(params: {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
} = {}): Promise<Page<ServiceRequest>> {
  const searchParams = new URLSearchParams()
  
  if (params.page !== undefined) searchParams.set('page', params.page.toString())
  if (params.size !== undefined) searchParams.set('size', params.size.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortDir) searchParams.set('sortDir', params.sortDir)

  const url = `${DEVICE_SERVICE_URL}/api/service-requests/pending?${searchParams}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<Page<ServiceRequest>> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch pending service requests')
  }
  
  return data.data
}

/**
 * Update service request staff notes
 */
export async function updateServiceRequestStaffNotes(id: number, staffNotes: string): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/staff/${id}/notes`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ staffNotes })
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequest> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to update staff notes')
  }
  
  return data.data
}

/**
 * Get service request statistics for staff dashboard
 */
export async function getAllServiceRequestStatistics(): Promise<ServiceRequestStatistics> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/statistics/all`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await getValidAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequestStatistics> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch service request statistics')
  }
  
  return data.data
} 