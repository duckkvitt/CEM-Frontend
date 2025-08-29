// Simple fetch-based API client
const API_BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080/api'

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
}

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const token = getAuthToken()
  return !!token
}

// Helper function to set auth token
export const setAuthToken = (token: string, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return
  
  if (rememberMe) {
    localStorage.setItem('accessToken', token)
  } else {
    sessionStorage.setItem('accessToken', token)
  }
}

// Helper function to clear auth token
export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('accessToken')
  sessionStorage.removeItem('accessToken')
}

// Helper function to test authentication status
export const testAuthentication = (): void => {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment')
    return
  }
  
  const accessToken = getAuthToken()
  const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
  
  console.log('Authentication Status:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasCurrentUser: !!currentUser,
    accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'None',
    currentUser: currentUser ? JSON.parse(currentUser) : 'None'
  })
  
  if (!accessToken) {
    console.warn('No access token found. Please log in.')
  } else {
    console.log('Access token found and valid.')
  }
}

// Generic fetch wrapper with authentication
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken()
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  // Handle authentication errors
  if (response.status === 401) {
    console.log('401 Unauthorized - clearing tokens and redirecting to login')
    clearAuthToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }
  
  if (response.status === 403) {
    console.log('403 Forbidden - user may not have permission or token is invalid')
    throw new Error('Forbidden')
  }
  
  return response
}

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}


