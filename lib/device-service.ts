import { DEVICE_SERVICE_URL } from './api'
import { getValidAccessToken, logout } from './auth'
import { handleApiError } from './error-utils'

export interface CustomerDevice {
  id: number
  customerId: number
  contractId?: number
  deviceId: number
  deviceName: string
  deviceModel?: string
  serialNumber?: string
  devicePrice?: number
  deviceUnit?: string
  customerDeviceCode?: string
  warrantyEnd?: string
  status: string
  warrantyExpired: boolean
  warrantyExpiringSoon: boolean
  createdAt: string
  updatedAt: string
}

export interface DeviceStatistics {
  totalDevices: number
  activeDevices: number
  maintenanceDevices: number
  brokenDevices: number
  expiredWarrantyDevices: number
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
 * Fetch customer's purchased devices with pagination and filtering
 */
export async function getCustomerDevices(params: {
  keyword?: string
  status?: string
  warrantyExpired?: boolean
  contractId?: number
  page?: number
  size?: number
}): Promise<Page<CustomerDevice>> {
  const searchParams = new URLSearchParams()
  
  if (params.keyword) searchParams.append('keyword', params.keyword)
  if (params.status) searchParams.append('status', params.status)
  if (params.warrantyExpired !== undefined) searchParams.append('warrantyExpired', params.warrantyExpired.toString())
  if (params.page !== undefined) searchParams.append('page', params.page.toString())
  if (params.size !== undefined) searchParams.append('size', params.size.toString())
  if (params.contractId !== undefined) searchParams.append('contractId', params.contractId.toString())
  
  const url = `${DEVICE_SERVICE_URL}/customer-devices?${searchParams.toString()}`
  
  const token = await getValidAccessToken()
  if (!token) {
    await logout()
    throw new Error('Authentication failed - Please log in again')
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  // Handle token expiration
  if (response.status === 401) {
    console.log('401 Unauthorized - token may be expired, logging out')
    await logout()
    throw new Error('Session expired - Please log in again')
  }
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  const data: ApiResponse<Page<CustomerDevice>> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch devices')
  }
  
  return data.data
}

/**
 * Fetch customer device statistics
 */
export async function getCustomerDeviceStatistics(): Promise<DeviceStatistics> {
  const url = `${DEVICE_SERVICE_URL}/customer-devices/statistics`
  
  const token = await getValidAccessToken()
  if (!token) {
    await logout()
    throw new Error('Authentication failed - Please log in again')
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  // Handle token expiration
  if (response.status === 401) {
    console.log('401 Unauthorized - token may be expired, logging out')
    await logout()
    throw new Error('Session expired - Please log in again')
  }
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  const data: ApiResponse<DeviceStatistics> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch statistics')
  }
  
  return data.data
}

/**
 * Fetch devices with expiring warranty
 */
export async function getDevicesWithExpiringWarranty(): Promise<CustomerDevice[]> {
  const url = `${DEVICE_SERVICE_URL}/customer-devices/expiring-warranty`
  
  const token = await getValidAccessToken()
  if (!token) {
    await logout()
    throw new Error('Authentication failed - Please log in again')
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  // Handle token expiration
  if (response.status === 401) {
    console.log('401 Unauthorized - token may be expired, logging out')
    await logout()
    throw new Error('Session expired - Please log in again')
  }
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  const data: ApiResponse<CustomerDevice[]> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch devices with expiring warranty')
  }
  
  return data.data
}

/**
 * Get customer device by ID
 */
export async function getCustomerDeviceById(deviceId: number): Promise<CustomerDevice> {
  const url = `${DEVICE_SERVICE_URL}/customer-devices/${deviceId}`
  
  const token = await getValidAccessToken()
  if (!token) {
    await logout()
    throw new Error('Authentication failed - Please log in again')
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  // Handle token expiration
  if (response.status === 401) {
    console.log('401 Unauthorized - token may be expired, logging out')
    await logout()
    throw new Error('Session expired - Please log in again')
  }
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  const data: ApiResponse<CustomerDevice> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch device')
  }
  
  return data.data
} 