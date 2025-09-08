import { NextRequest, NextResponse } from 'next/server'
import { DEVICE_SERVICE_URL } from '@/lib/api'
import { extractErrorMessage } from '@/lib/error-utils'

/**
 * API handler for retrieving all devices for dropdown selection
 * This proxies the request to the backend device service
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
    // We fetch all devices with a large page size for dropdown selection
    const url = `${DEVICE_SERVICE_URL}/devices?size=1000`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })
    
    if (!response.ok) {
      console.error('Backend error while fetching devices:', response.status)
      const errorMessage = await extractErrorMessage(response)
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { message: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
} 