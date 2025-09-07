import { NextRequest, NextResponse } from 'next/server'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'

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
      console.error('Backend error while fetching customers:', response.status, await response.text())
      // Try to extract error message from backend response
      try {
        const errorData = await response.json();
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
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
