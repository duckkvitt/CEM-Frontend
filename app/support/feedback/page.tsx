'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Filter, Search, Star, Users } from 'lucide-react'
import { listFeedbacks, type FeedbackItem, type Page } from '@/lib/feedback-service'
import { getCurrentUserRole } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} star rating`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star key={idx} className={`h-4 w-4 ${idx < value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
      ))}
    </div>
  )
}

function FeedbackListContent() {
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

  const changeFilter = (k: string, v: string | number) => setFilters(prev => ({ ...prev, [k]: v, page: 0 }))
  const goToPage = (page: number) => setFilters(prev => ({ ...prev, page }))

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Feedback</h1>
          <p className="text-sm text-muted-foreground">Explore customer sentiment across service requests.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Total</span>
          <Badge variant="secondary">{data?.totalElements ?? '—'}</Badge>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={filters.keyword} onChange={e => changeFilter('keyword', e.target.value)} placeholder="Search comment, request code..." className="pl-9" />
              </div>
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
            <div>
              <Label>Page Size</Label>
              <Select value={String(filters.size)} onValueChange={v => changeFilter('size', Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10,20,30,50].map(s => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-72" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="p-6 text-destructive">{error}</div>
            ) : (data && data.content.length > 0) ? (
              data.content.map(item => (
                <div key={item.id} className="p-4 flex items-start justify-between hover:bg-accent/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.serviceRequestCode || `#${item.serviceRequestId}`}</span>
                      <Badge variant="outline" className="uppercase">{item.serviceType}</Badge>
                      <RatingStars value={item.starRating} />
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(item.submittedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{item.deviceName} • {item.deviceType}</div>
                    {item.comment && <div className="mt-1 text-sm line-clamp-2 max-w-[80ch]">{item.comment}</div>}
                    <div className="mt-1 text-sm text-muted-foreground flex gap-4">
                      <span>Customer: {item.customerName || '—'}</span>
                      <span>Technician: {item.technicianName || '—'}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button variant="outline" onClick={() => router.push(`/support/feedback/${item.id}`)}>View</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-accent grid place-content-center">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="font-medium">No feedbacks found</div>
                <div className="text-sm text-muted-foreground">Try adjusting filters or date range.</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => goToPage(Math.max(0, filters.page - 1))} />
            </PaginationItem>
            {Array.from({ length: data.totalPages }).slice(0, 10).map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  href="#"
                  isActive={filters.page === idx}
                  onClick={(e) => { e.preventDefault(); goToPage(idx) }}
                >
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => goToPage(Math.min(data.totalPages - 1, filters.page + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default function FeedbackListPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <FeedbackListContent />
    </Suspense>
  )
}



