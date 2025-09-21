'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Wrench, 
  Shield,
  FileText,
  Download,
  Calendar,
  MessageSquare,
  User,
  AlertCircle,
  ExternalLink,
  Star
} from 'lucide-react'
import { motion } from 'framer-motion'
import { getCurrentUserRole } from '@/lib/auth'
import { 
  getServiceRequestById,
  addComment,
  ServiceRequest,
  ServiceRequestHistory
} from '@/lib/service-request-service'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getMyFeedbackByServiceRequest } from '@/lib/feedback-service'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800'
}

const STATUS_ICONS = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  ASSIGNED: CheckCircle,
  IN_PROGRESS: Wrench,
  COMPLETED: CheckCircle
}

const TYPE_COLORS = {
  MAINTENANCE: 'bg-blue-100 text-blue-800',
  WARRANTY: 'bg-green-100 text-green-800'
}

const TYPE_ICONS = {
  MAINTENANCE: Wrench,
  WARRANTY: Shield
}

export default function ServiceRequestDetailPage() {
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState<number>(5)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [myFeedback, setMyFeedback] = useState<import('@/lib/feedback-service').FeedbackItem | null>(null)
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && role !== 'CUSTOMER') {
      router.replace('/dashboard')
    }
  }, [role, router])

  useEffect(() => {
    if (role === 'CUSTOMER' && requestId) {
      fetchServiceRequest()
      ;(async () => {
        try {
          const fb = await getMyFeedbackByServiceRequest(Number(requestId))
          setMyFeedback(fb)
        } catch {
          setMyFeedback(null)
        }
      })()
    }
  }, [role, requestId])

  const fetchServiceRequest = async () => {
    try {
      setLoading(true)
      const data = await getServiceRequestById(parseInt(requestId))
      setServiceRequest(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch service request'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !serviceRequest) return

    setSubmittingComment(true)
    try {
      const updatedRequest = await addComment(serviceRequest.id, newComment.trim())
      setServiceRequest(updatedRequest)
      setNewComment('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add comment'
      setError(msg)
    } finally {
      setSubmittingComment(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock
    return <Icon className="h-4 w-4" />
  }

  const getTypeIcon = (type: string) => {
    const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Wrench
    return <Icon className="h-4 w-4" />
  }

  const downloadAttachment = (fileId: string, fileName: string) => {
    // This would typically open the Google Drive file in a new tab
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    window.open(downloadUrl, '_blank')
  }

  if (role && role !== 'CUSTOMER') {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/service-requests')}>
            Back to Service Requests
          </Button>
        </div>
      </div>
    )
  }

  if (!serviceRequest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Request Not Found</h2>
          <p className="text-gray-600 mb-4">The service request you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/service-requests')}>
            Back to Service Requests
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => router.push('/service-requests')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Service Requests
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{serviceRequest.requestId}</h1>
          <Badge className={STATUS_COLORS[serviceRequest.status as keyof typeof STATUS_COLORS]}>
            {getStatusIcon(serviceRequest.status)}
            {serviceRequest.status.replace('_', ' ')}
          </Badge>
          <Badge className={TYPE_COLORS[serviceRequest.type as keyof typeof TYPE_COLORS]}>
            {getTypeIcon(serviceRequest.type)}
            {serviceRequest.type}
          </Badge>
          {serviceRequest.status === 'COMPLETED' && !myFeedback && (
            <Button onClick={() => setShowFeedback(true)} className="ml-auto flex items-center gap-2">
              <Star className="h-4 w-4" />
              Give Feedback
            </Button>
          )}
        </div>
        
        <p className="text-gray-600">
          Device: {serviceRequest.deviceName}
          {serviceRequest.deviceModel && ` (${serviceRequest.deviceModel})`}
          {serviceRequest.serialNumber && ` • Serial: ${serviceRequest.serialNumber}`}
        </p>
      </motion.div>

      {/* Feedback Modal */}
      {serviceRequest && (
        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Our Service</DialogTitle>
              <DialogDescription>
                Please rate your experience and leave an optional comment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    className={cn('p-1 rounded transition-colors', n <= rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400')}
                    onClick={() => setRating(n)}
                    aria-label={`Rate ${n} star${n>1?'s':''}`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-2">{rating}/5</span>
              </div>
              <div>
                <Label className="text-sm">Comment (optional)</Label>
                <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share more about your experience..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFeedback(false)}>Cancel</Button>
              <Button
                disabled={feedbackSubmitting}
                onClick={async () => {
                  try {
                    setFeedbackSubmitting(true)
                    const { submitFeedback } = await import('@/lib/feedback-service')
                    await submitFeedback({ serviceRequestId: serviceRequest.id, starRating: rating, comment: newComment || undefined })
                    setShowFeedback(false)
                    toast.success('Feedback submitted. Thank you!')
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Failed to submit feedback'
                    toast.error(msg)
                  } finally {
                    setFeedbackSubmitting(false)
                  }
                }}
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{serviceRequest.description}</p>
              </div>
              
              {serviceRequest.customerComments && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Additional Comments</Label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{serviceRequest.customerComments}</p>
                </div>
              )}
              
              {serviceRequest.staffNotes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Staff Notes</Label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{serviceRequest.staffNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {serviceRequest.attachments && serviceRequest.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceRequest.attachments.map((fileId, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Attachment {index + 1}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment(fileId, `attachment_${index + 1}`)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History Timeline */}
          {serviceRequest.history && serviceRequest.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Request History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceRequest.history.map((entry, index) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < serviceRequest.history!.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}>
                            {getStatusIcon(entry.status)}
                            {entry.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">{formatDate(entry.createdAt)}</span>
                        </div>
                        <p className="text-gray-900">{entry.comment}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Updated by: {entry.updatedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Feedback */}
          {myFeedback && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Your Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">Submitted at {new Date(myFeedback.submittedAt).toLocaleString()}</div>
                <div className="text-lg">{'★'.repeat(myFeedback.starRating)}{'☆'.repeat(5-myFeedback.starRating)}</div>
                {myFeedback.comment && <div className="whitespace-pre-wrap">{myFeedback.comment}</div>}
              </CardContent>
            </Card>
          )}

          {/* Add Comment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Add Comment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="comment" className="text-sm font-medium">
                  Your Comment
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Add a comment or question about this request..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] mt-1"
                />
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                className="w-full"
              >
                {submittingComment ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding Comment...
                  </div>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Request ID</Label>
                <p className="text-gray-900 font-mono">{serviceRequest.requestId}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Created</Label>
                <p className="text-gray-900">{formatDate(serviceRequest.createdAt)}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                <p className="text-gray-900">{formatDate(serviceRequest.updatedAt)}</p>
              </div>
              
              {serviceRequest.preferredDateTime && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Preferred Date/Time</Label>
                  <p className="text-gray-900">{formatDate(serviceRequest.preferredDateTime)}</p>
                </div>
              )}

              {serviceRequest.workLocation && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Work Location</Label>
                  <p className="text-gray-900 whitespace-pre-wrap">{serviceRequest.workLocation}</p>
                </div>
              )}
              
              {serviceRequest.completedAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Completed</Label>
                  <p className="text-gray-900">{formatDate(serviceRequest.completedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Device Name</Label>
                <p className="text-gray-900">{serviceRequest.deviceName}</p>
              </div>
              
              {serviceRequest.deviceModel && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Model</Label>
                  <p className="text-gray-900">{serviceRequest.deviceModel}</p>
                </div>
              )}
              
              {serviceRequest.serialNumber && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Serial Number</Label>
                  <p className="text-gray-900 font-mono">{serviceRequest.serialNumber}</p>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => router.push(`/my-devices/${serviceRequest.deviceId}`)}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Device Details
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 