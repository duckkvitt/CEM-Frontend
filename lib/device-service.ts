import { DEVICE_SERVICE_URL } from './api'
import { getAccessToken } from './auth'

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
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      } else if (errorData.error) {
        throw new Error(errorData.error);
      }
    } catch (parseError) {
      // If we can't parse the error response, try to get text content
      try {
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          throw new Error(`Server error: ${errorText}`);
        }
      } catch (textError) {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Request failed with status ${response.status}`);
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
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      } else if (errorData.error) {
        throw new Error(errorData.error);
      }
    } catch (parseError) {
      // If we can't parse the error response, try to get text content
      try {
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          throw new Error(`Server error: ${errorText}`);
        }
      } catch (textError) {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Request failed with status ${response.status}`);
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
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      } else if (errorData.error) {
        throw new Error(errorData.error);
      }
    } catch (parseError) {
      // If we can't parse the error response, try to get text content
      try {
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          throw new Error(`Server error: ${errorText}`);
        }
      } catch (textError) {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Request failed with status ${response.status}`);
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
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      } else if (errorData.error) {
        throw new Error(errorData.error);
      }
    } catch (parseError) {
      // If we can't parse the error response, try to get text content
      try {
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          throw new Error(`Server error: ${errorText}`);
        }
      } catch (textError) {
        // Ignore text parsing errors
      }
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  
  const data: ApiResponse<CustomerDevice> = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch device')
  }
  
  return data.data
} 