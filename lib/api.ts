export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:8080/api'

// Ensure we have exactly one `/api` prefix (handle cases where env var already includes it)
const API_BASE = GATEWAY_URL.endsWith('/api') ? GATEWAY_URL : `${GATEWAY_URL}/api`

// Base path for each micro-service routed through the API Gateway
export const AUTH_SERVICE_URL = `${API_BASE}/auth`
export const CUSTOMER_SERVICE_URL = `${API_BASE}/customer`
export const DEVICE_SERVICE_URL = `${API_BASE}/device`
export const CONTRACT_SERVICE_URL = `${API_BASE}/contract`
export const SPARE_PARTS_SERVICE_URL = `${API_BASE}/spare-parts`
export const SUPPLIERS_SERVICE_URL = `${API_BASE}/suppliers`

// API helper functions
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') : null
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 403) {
      console.warn('Authentication error (403) - User may not have permission or token is invalid')
      throw new Error('Authentication failed - Please log in again')
    } else if (response.status === 401) {
      console.warn('Unauthorized error (401) - Token may be expired')
      throw new Error('Session expired - Please log in again')
    } else {
      // Try to extract error message from response body
      try {
        const errorData = await response.json();
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
          throw new Error(errorData.error);
        } else {
          const errorText = JSON.stringify(errorData);
          if (errorText && errorText !== '{}') {
            throw new Error(`Server error: ${errorText}`);
          }
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
      throw new Error(`Request failed with status ${response.status}`)
    }
  }

  return response.json()
}

// Get users by role from the authentication service
export async function getUsersByRole(roleName: string, page: number = 0, size: number = 20) {
  const role = await fetchWithAuth(`${AUTH_SERVICE_URL}/v1/auth/admin/roles/by-name/${roleName}`)
  
  if (!role.data) {
    throw new Error(`Role ${roleName} not found`)
  }

  const users = await fetchWithAuth(
    `${AUTH_SERVICE_URL}/v1/auth/admin/users?roleId=${role.data.id}&page=${page}&size=${size}`
  )

  return users.data
}