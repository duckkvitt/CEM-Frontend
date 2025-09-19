'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getFeedbackById, type FeedbackItem } from '@/lib/feedback-service'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, ChevronLeft, MonitorCog, Star, User2, Wrench } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} star rating`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star key={idx} className={`h-4 w-4 ${idx < value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
      ))}
    </div>
  )
}

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 grid md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
            <div className="md:col-span-2 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (error) return <div className="p-6 text-destructive">{error}</div>
  if (!data) return <div className="p-6">Not found</div>

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-foreground">Support / Feedback</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Feedback #{data.id}</h1>
            <Badge variant="outline" className="uppercase">{data.serviceType}</Badge>
            <RatingStars value={data.starRating} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2"><User2 className="h-4 w-4" /> Customer</div>
            <div className="font-medium">{data.customerName || '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2"><Wrench className="h-4 w-4" /> Service Request</div>
            <div className="font-medium">{data.serviceRequestCode || `#${data.serviceRequestId}`}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2"><MonitorCog className="h-4 w-4" /> Device</div>
            <div className="font-medium">{data.deviceName} • {data.deviceType}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Service Type</div>
            <div className="font-medium">{data.serviceType}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Star Rating</div>
            <div className="font-medium"><RatingStars value={data.starRating} /></div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Submission Date</div>
            <div className="font-medium">{new Date(data.submittedAt).toLocaleString()}</div>
          </div>
          <div className="md:col-span-2 space-y-1">
            <div className="text-sm text-muted-foreground">Technician</div>
            <div className="font-medium">{data.technicianName || '—'}</div>
          </div>
          <div className="md:col-span-2 space-y-1">
            <div className="text-sm text-muted-foreground">Full Comment</div>
            <div className="font-medium whitespace-pre-wrap leading-relaxed bg-accent/40 rounded-md p-3">
              {data.comment || '—'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



