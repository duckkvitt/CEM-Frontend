import { CUSTOMER_SERVICE_URL } from './api'
import { getValidAccessToken, logout } from './auth'
import { handleApiError } from './error-utils'

export interface CustomerResponse {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  company?: string
  taxCode?: string
  isHidden?: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  data: T
  message: string
  status: string
  timestamp: string
}

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// Common error handling function
async function handleErrors(response: Response): Promise<void> {
  if (!response.ok) {
    await handleApiError(response);
  }
}

// Helper for making authenticated requests with automatic token refresh
async function authenticatedFetch<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
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

  await handleErrors(response)
  const data: ApiResponse<T> = await response.json()
  return data.data
}

// Get all customers for filtering
export async function getAllCustomers(): Promise<CustomerResponse[]> {
  try {
    const response = await authenticatedFetch<PageResponse<CustomerResponse>>(`${CUSTOMER_SERVICE_URL}/v1/customers/visible?size=1000`)
    return response.content || []
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

// Get customers with pagination and search
export async function getCustomers(
  page = 0,
  size = 20,
  search?: string
): Promise<PageResponse<CustomerResponse>> {
  let url = `${CUSTOMER_SERVICE_URL}/v1/customers?page=${page}&size=${size}`
  
  if (search) {
    url += `&name=${encodeURIComponent(search)}`
  }
  
  return authenticatedFetch<PageResponse<CustomerResponse>>(url)
}

// Get customer by ID
export async function getCustomerById(id: number): Promise<CustomerResponse> {
  return authenticatedFetch<CustomerResponse>(`${CUSTOMER_SERVICE_URL}/v1/customers/${id}`)
} 