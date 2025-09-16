'use client'

// Utility helpers to retrieve auth information from browser storage
// and provide common helpers for role‐based UI rendering.

import { AUTH_SERVICE_URL } from '@/lib/api'

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR' | string

export interface CurrentUser {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName?: string
  phone?: string | null
  role?: {
    id: number
    name: UserRole
  }
  status?: string
  emailVerified?: boolean
}

export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  user?: CurrentUser
}

/**
 * Retrieve the access token from either localStorage or sessionStorage.
 */
export function getAccessToken (): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  )
}

/**
 * Check if a JWT token is expired by decoding its payload
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true
  
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) return true
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    
    // Check if token has expiration time (exp claim)
    if (!payload.exp) return false
    
    // Convert exp from seconds to milliseconds and compare with current time
    const currentTime = Date.now()
    const expirationTime = payload.exp * 1000
    
    // Add a 5-minute buffer to refresh before actual expiration
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    
    return currentTime >= (expirationTime - bufferTime)
  } catch (error) {
    console.error('Error decoding token:', error)
    return true
  }
}

/**
 * Check if user is authenticated with a valid, non-expired token
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false
  
  try {
    return !isTokenExpired(token)
  } catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}

/**
 * Retrieve the refresh token from storage.
 */
export function getRefreshToken (): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
  )
}

/**
 * Return the persisted current user object, if any.
 */
export function getCurrentUser (): CurrentUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
  if (!raw) return null
  try {
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}

/**
 * Convenience helper to extract and normalise the role of the current user.
 */
export function getCurrentUserRole (): UserRole | null {
  const user = getCurrentUser()
  if (!user?.role?.name) return null
  return user.role.name as UserRole
}

/**
 * Extract the user ID from the current user token/session.
 */
export function extractUserIdFromToken (): number | null {
  const user = getCurrentUser()
  return user?.id || null
}

export function isAdmin (): boolean {
  const role = getCurrentUserRole()
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

/**
 * Store authentication tokens based on remember preference
 * Always store in localStorage for cross-tab consistency, but respect remember preference for persistence
 */
export function storeTokens(tokens: TokenResponse, rememberMe: boolean = false): void {
  if (typeof window === 'undefined') return
  
  // Clear tokens from both storages first
  clearTokens()
  
  // Always store in localStorage for cross-tab consistency
  localStorage.setItem('accessToken', tokens.accessToken)
  if (tokens.refreshToken) {
    localStorage.setItem('refreshToken', tokens.refreshToken)
  }
  if (tokens.user) {
    localStorage.setItem('currentUser', JSON.stringify(tokens.user))
  }
  
  // Store remember preference
  localStorage.setItem('rememberMe', rememberMe.toString())
  
  // If rememberMe is false, also store in sessionStorage for session-only behavior
  if (!rememberMe) {
    sessionStorage.setItem('accessToken', tokens.accessToken)
    if (tokens.refreshToken) {
      sessionStorage.setItem('refreshToken', tokens.refreshToken)
    }
    if (tokens.user) {
      sessionStorage.setItem('currentUser', JSON.stringify(tokens.user))
    }
  }
}

/**
 * Clear all authentication tokens from storage
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('currentUser')
  localStorage.removeItem('rememberMe')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('refreshToken')
  sessionStorage.removeItem('currentUser')
}

/**
 * Get the remember me preference
 */
export function getRememberPreference(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('rememberMe') === 'true'
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    console.log('No refresh token available')
    return null
  }
  
  // Check if refresh token is also expired
  if (isTokenExpired(refreshToken)) {
    console.log('Refresh token is also expired')
    await logout()
    return null
  }
  
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    })
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.log('Refresh token is invalid or expired')
        await logout()
        return null
      }
      throw new Error(`Refresh failed: ${response.status}`)
    }
    
    const data = await response.json()
    if (!data.success || !data.data?.accessToken) {
      throw new Error('Invalid refresh response')
    }
    
    const { accessToken, refreshToken: newRefreshToken, user } = data.data
    const rememberMe = getRememberPreference()
    
    // Store the new tokens
    storeTokens({
      accessToken,
      refreshToken: newRefreshToken || refreshToken,
      user: user || getCurrentUser()
    }, rememberMe)
    
    console.log('Token refreshed successfully')
    return accessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    // Clear tokens and redirect to login
    await logout()
    return null
  }
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  const currentToken = getAccessToken()
  
  if (!currentToken) {
    return null
  }
  
  if (!isTokenExpired(currentToken)) {
    return currentToken
  }
  
  console.log('Token expired, attempting refresh...')
  return await refreshAccessToken()
}

/**
 * Logout the current user by notifying the backend (best-effort) and
 * then clearing all locally stored authentication information.
 */
export async function logout (): Promise<void> {
  const accessToken = getAccessToken()
  
  try {
    if (accessToken) {
      await fetch(`${AUTH_SERVICE_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    }
  } catch {
    // Ignore network/API errors. We still proceed to clear local state.
  } finally {
    clearTokens()
    
    // Redirect to login page if we're not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }
}

/**
 * Initialize authentication monitoring - call this on app startup
 * Sets up periodic token validation and cross-tab synchronization
 */
export function initializeAuthMonitoring(): void {
  if (typeof window === 'undefined') return
  
  // Check token validity on page load
  validateTokenOnLoad()
  
  // Set up periodic token validation (every 5 minutes)
  const validationInterval = setInterval(() => {
    if (!isAuthenticated()) {
      clearInterval(validationInterval)
      logout()
    }
  }, 5 * 60 * 1000) // 5 minutes
  
  // Listen for storage changes to sync across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'accessToken' && e.newValue === null) {
      // Token was cleared in another tab, logout this tab too
      logout()
    }
  })
  
  // Listen for focus events to validate token when user returns to tab
  window.addEventListener('focus', () => {
    if (!isAuthenticated()) {
      logout()
    }
  })
  
  // Handle browser close/refresh for session-only users
  window.addEventListener('beforeunload', () => {
    const rememberMe = getRememberPreference()
    if (!rememberMe) {
      // Clear sessionStorage for session-only users
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('refreshToken')
      sessionStorage.removeItem('currentUser')
    }
  })
}

/**
 * Validate token on page load and handle expiration
 */
function validateTokenOnLoad(): void {
  const token = getAccessToken()
  if (!token) {
    return
  }
  
  if (isTokenExpired(token)) {
    console.log('Token expired on page load, attempting refresh...')
    refreshAccessToken().then((newToken) => {
      if (!newToken) {
        console.log('Token refresh failed, logging out...')
        logout()
      }
    })
  }
} 