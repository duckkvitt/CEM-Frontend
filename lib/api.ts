export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:8080'

// Ensure we have exactly one `/api` prefix (handle cases where env var already includes it)
const API_BASE = GATEWAY_URL.endsWith('/api') ? GATEWAY_URL : `${GATEWAY_URL}/api`

// Base path for each micro-service routed through the API Gateway
export const AUTH_SERVICE_URL = `${API_BASE}/auth`
export const CUSTOMER_SERVICE_URL = `${API_BASE}/customer`
export const DEVICE_SERVICE_URL = `${API_BASE}/device`