import { DEVICE_SERVICE_URL } from './api'
import { getAccessToken } from './auth'

export interface ServiceRequest {
  id: number
  requestId: string
  customerId: number
  deviceId: number
  deviceName: string
  deviceModel?: string
  serialNumber?: string
  type: 'MAINTENANCE' | 'WARRANTY'
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED'
  description: string
  preferredDateTime?: string
  attachments?: string[]
  staffNotes?: string
  customerComments?: string
  estimatedCost?: number
  actualCost?: number
  completedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  history?: ServiceRequestHistory[]
}

export interface ServiceRequestHistory {
  id: number
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED'
  comment: string
  updatedBy: string
  createdAt: string
}

export interface ServiceRequestStatistics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
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
  attachments?: string[]
  customerComments?: string
}

export interface UpdateServiceRequestRequest {
  description?: string
  preferredDateTime?: string
  attachments?: string[]
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
  // Try to read error response body first
  try {
    const errorData = await response.json()
    if (errorData.message) {
      // If there are validation errors in the errors object, combine them with the main message
      if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
        const validationErrors = Object.values(errorData.errors).join(', ');
        throw new Error(`${errorData.message}: ${validationErrors}`);
      }
      throw new Error(errorData.message);
    } else if (errorData.errors) {
      // Handle validation errors - backend returns errors as object/map
      if (typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
        const errorMessages = Object.values(errorData.errors).join(', ');
        throw new Error(errorMessages);
      } else if (Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors.map((err: any) => err.defaultMessage || err.message || err).join(', ');
        throw new Error(errorMessages);
      }
    }
  } catch (parseError) {
    // If we can't parse the response, try to get text content
    try {
      const errorText = await response.text();
      if (errorText && errorText.trim()) {
        throw new Error(`Server error: ${errorText}`);
      }
    } catch (textError) {
      // Ignore text parsing errors
    }
  }
  throw new Error(`Request failed with status ${response.status}`)
}

/**
 * Create a new service request
 */
export async function createServiceRequest(request: CreateServiceRequestRequest): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    await handleErrorResponse(response)
  }
  
  const data: ApiResponse<ServiceRequest> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to create service request')
  }
  
  return data.data
}

/**
 * Get service request by ID
 */
export async function getServiceRequestById(id: number): Promise<ServiceRequest> {
  const url = `${DEVICE_SERVICE_URL}/api/service-requests/${id}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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
      'Authorization': `Bearer ${getAccessToken()}`,
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