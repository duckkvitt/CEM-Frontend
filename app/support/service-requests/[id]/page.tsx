"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { getServiceRequestByIdForStaff, type ServiceRequest } from '@/lib/service-request-service'

export default function ServiceRequestDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const idParam = params?.id
      if (!idParam) return
      const numericId = Number(idParam)
      if (Number.isNaN(numericId)) {
        setError('Invalid service request id')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await getServiceRequestByIdForStaff(numericId)
        setData(res)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load service request'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params?.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => router.back()}>Back</Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Service Request #{data.requestId}</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className="ml-2 font-medium">{data.status}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Type:</span>
            <span className="ml-2 font-medium">{data.type}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Device:</span>
            <span className="ml-2 font-medium">{data.deviceName}{data.deviceModel ? ` (${data.deviceModel})` : ''}{data.serialNumber ? ` • SN: ${data.serialNumber}` : ''}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Description:</span>
            <p className="mt-1">{data.description}</p>
          </div>
          {data.workLocation && (
            <div>
              <span className="text-sm text-muted-foreground">Work Location:</span>
              <p className="mt-1">{data.workLocation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


