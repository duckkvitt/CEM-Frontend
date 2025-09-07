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
async function handleErrors(response: Response): Promise<void> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      // Extract error message from backend response
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
      } else if (errorData.error) {
        // Try alternative error field
        throw new Error(errorData.error);
      } else {
        // Try to extract any meaningful error text from the response
        const errorText = JSON.stringify(errorData);
        if (errorText && errorText !== '{}') {
          throw new Error(`Server error: ${errorText}`);
        }
        throw new Error(`Request failed with status ${response.status}`);
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
      throw new Error(`Request failed with status ${response.status}`);
    }
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

  await handleErrors(response)
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