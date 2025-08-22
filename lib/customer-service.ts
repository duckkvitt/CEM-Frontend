import { CUSTOMER_SERVICE_URL } from './api'
import { getAccessToken } from './auth'

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
function handleErrors(response: Response): void {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
}

// Helper for making authenticated requests
async function authenticatedFetch<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  const token = getAccessToken()
  
  if (!token) {
    throw new Error('No authentication token available')
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

  handleErrors(response)
  const data: ApiResponse<T> = await response.json()
  return data.data
}

// Get all customers for filtering
export async function getAllCustomers(): Promise<CustomerResponse[]> {
  const token = getAccessToken()
  if (!token) return []
  const response = await authenticatedFetch<PageResponse<CustomerResponse>>(`${CUSTOMER_SERVICE_URL}/v1/customers/visible?size=1000`)
  return response.content || []
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