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

export function isAdmin (): boolean {
  const role = getCurrentUserRole()
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentUser')
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('refreshToken')
      sessionStorage.removeItem('currentUser')
    }
  }
} 