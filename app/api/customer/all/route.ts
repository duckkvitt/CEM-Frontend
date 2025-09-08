import { NextRequest, NextResponse } from 'next/server'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { extractErrorMessage } from '@/lib/error-utils'

/**
 * API handler for retrieving all visible customers (or all customers if needed)
 * This proxies the request to the backend customer service
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    )
  }
  
  try {
    // We fetch visible (non-hidden) customers with a large page size to simulate "all"
    const url = `${CUSTOMER_SERVICE_URL}/v1/customers/visible?page=0&size=1000`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })
    
    if (!response.ok) {
      console.error('Backend error while fetching customers:', response.status)
      const errorMessage = await extractErrorMessage(response)
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { message: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
