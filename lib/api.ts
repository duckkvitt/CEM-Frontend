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

import { extractErrorMessage } from './error-utils'

// API helper functions
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Import auth functions dynamically to avoid circular imports
  const { getValidAccessToken, logout } = await import('@/lib/auth')
  
  const token = await getValidAccessToken()
  
  if (!token) {
    await logout()
    throw new Error('Authentication failed - Please log in again')
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Unauthorized error (401) - Token may be expired, logging out')
      await logout()
      throw new Error('Session expired - Please log in again')
    } else if (response.status === 403) {
      console.warn('Authentication error (403) - User may not have permission or token is invalid')
      throw new Error('Authentication failed - Please log in again')
    } else {
      const errorMessage = await extractErrorMessage(response);
      throw new Error(errorMessage);
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