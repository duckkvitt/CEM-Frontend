'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from 'lucide-react'
import { listFeedbacks, type FeedbackItem, type Page } from '@/lib/feedback-service'
import { getCurrentUserRole } from '@/lib/auth'

export default function FeedbackListPage() {
  const [data, setData] = useState<Page<FeedbackItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    keyword: '',
    starRating: 'ALL',
    serviceType: 'ALL',
    fromDate: '',
    toDate: '',
    page: 0,
    size: 10,
    sortBy: 'submittedAt',
    sortDir: 'desc' as 'asc' | 'desc'
  })
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const role = getCurrentUserRole()
    if (role && !['SUPPORT_TEAM','MANAGER'].includes(role)) {
      router.replace('/dashboard')
    }
  }, [router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const page = await listFeedbacks({
          keyword: filters.keyword || undefined,
          starRating: filters.starRating === 'ALL' ? undefined : Number(filters.starRating),
          serviceType: filters.serviceType === 'ALL' ? undefined : filters.serviceType as any,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          page: filters.page,
          size: filters.size,
          sortBy: filters.sortBy,
          sortDir: filters.sortDir
        })
        setData(page)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load feedbacks')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filters])

  const changeFilter = (k: string, v: string) => setFilters(prev => ({ ...prev, [k]: v, page: 0 }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customer Feedback</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <Input value={filters.keyword} onChange={e => changeFilter('keyword', e.target.value)} placeholder="Search comment, request code..." />
            </div>
            <div>
              <Label>Star Rating</Label>
              <Select value={filters.starRating} onValueChange={v => changeFilter('starRating', v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {[1,2,3,4,5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} Star{n>1?'s':''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service Type</Label>
              <Select value={filters.serviceType} onValueChange={v => changeFilter('serviceType', v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  <SelectItem value="WARRANTY">WARRANTY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From</Label>
              <Input type="date" value={filters.fromDate} onChange={e => changeFilter('fromDate', e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={filters.toDate} onChange={e => changeFilter('toDate', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : error ? (
              <div className="p-6 text-destructive">{error}</div>
            ) : (
              data?.content.map(item => (
                <div key={item.id} className="p-4 flex items-start justify-between hover:bg-accent/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.serviceRequestCode || `#${item.serviceRequestId}`}</span>
                      <span className="text-sm text-muted-foreground">{new Date(item.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{item.deviceName} • {item.deviceType} • {item.serviceType}</div>
                    <div className="mt-1">{'★'.repeat(item.starRating)}{'☆'.repeat(5-item.starRating)}</div>
                    {item.comment && <div className="mt-1 text-sm">{item.comment}</div>}
                    {item.technicianName && <div className="mt-1 text-sm text-muted-foreground">Technician: {item.technicianName}</div>}
                  </div>
                  <div>
                    <Button variant="outline" onClick={() => router.push(`/support/feedback/${item.id}`)}>View</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



