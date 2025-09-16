'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getFeedbackById, type FeedbackItem } from '@/lib/feedback-service'

export default function FeedbackDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<FeedbackItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const item = await getFeedbackById(Number(id))
        setData(item)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-destructive">{error}</div>
  if (!data) return <div className="p-6">Not found</div>

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feedback #{data.id}</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Customer</div>
            <div className="font-medium">{data.customerName || data.customerId}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Service Request</div>
            <div className="font-medium">{data.serviceRequestCode || `#${data.serviceRequestId}`}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Device</div>
            <div className="font-medium">{data.deviceName} • {data.deviceType}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Service Type</div>
            <div className="font-medium">{data.serviceType}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Star Rating</div>
            <div className="font-medium">{'★'.repeat(data.starRating)}{'☆'.repeat(5-data.starRating)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Submission Date</div>
            <div className="font-medium">{new Date(data.submittedAt).toLocaleString()}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-muted-foreground">Technician</div>
            <div className="font-medium">{data.technicianName || data.technicianId || 'N/A'}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-muted-foreground">Full Comment</div>
            <div className="font-medium whitespace-pre-wrap">{data.comment || '—'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


