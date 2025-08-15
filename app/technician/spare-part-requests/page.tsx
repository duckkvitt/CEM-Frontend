'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  PackageOpen, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Wrench,
  Info
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { getAccessToken } from '@/lib/auth'
import { SPARE_PARTS_SERVICE_URL } from '@/lib/api'
import CreateSparePartRequestModal from './components/create-spare-part-request-modal'

interface SparePartRequest {
  id: number
  requestNumber: string
  requestedQuantity: number
  issuedQuantity: number
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'CANCELLED'
  approvalStatus?: 'APPROVED' | 'REJECTED'
  requestReason: string
  requestedBy: string
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
  approvalReason?: string
  issuedAt?: string
  issuedBy?: string
  notes?: string
  taskId?: number
  sparePart: {
    id: number
    partName: string
    partCode: string
    description: string
  }
}

interface SparePartAvailability {
  sparePartId: number
  availableQuantity: number
  isLowStock: boolean
  isOutOfStock: boolean
}

export default function TechnicianSparePartRequests() {
  const [requests, setRequests] = useState<SparePartRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<SparePartRequest | null>(null)
  const [showCreateRequest, setShowCreateRequest] = useState(false)

  useEffect(() => {
    loadMyRequests()
  }, [])

  const loadMyRequests = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      
      if (!token) {
        setError('Please login to access your requests')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const params = new URLSearchParams({
        page: '0',
        size: '50',
        ...(searchTerm && { keyword: searchTerm })
      })
      
      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests/my-requests?${params}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.content || [])
      } else {
        setError('Failed to load your requests')
      }

    } catch (err) {
      console.error('Error loading requests:', err)
      setError('Failed to load your requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadMyRequests()
  }

  const cancelRequest = async (requestId: number) => {
    try {
      const token = getAccessToken()
      if (!token) return

      const reason = prompt('Please provide a reason for cancellation:')
      if (!reason) return

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests/${requestId}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        loadMyRequests()
        setSelectedRequest(null)
      } else {
        setError('Failed to cancel request')
      }
    } catch (err) {
      console.error('Error cancelling request:', err)
      setError('Failed to cancel request')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'ISSUED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Issued</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'border-yellow-200 bg-yellow-50'
      case 'APPROVED': return 'border-blue-200 bg-blue-50'
      case 'ISSUED': return 'border-green-200 bg-green-50'
      case 'REJECTED': return 'border-red-200 bg-red-50'
      case 'CANCELLED': return 'border-gray-200 bg-gray-50'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="ml-60 flex-1 bg-background p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your requests...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="ml-60 flex-1 bg-background p-6">
          <Alert className="max-w-md mx-auto mt-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Spare Part Requests</h1>
            <p className="text-muted-foreground">
              Request spare parts needed for your tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PackageOpen className="h-8 w-8 text-primary" />
            <Button onClick={() => setShowCreateRequest(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">How to request spare parts</h3>
                <p className="text-sm text-blue-700 mt-1">
                  When working on a task, you can request spare parts needed for repairs. 
                  Your manager will review and approve the request before parts are issued from inventory.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Search by request number or spare part name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <PackageOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't made any spare part requests yet.
                </p>
                <Button onClick={() => setShowCreateRequest(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first request
                </Button>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className={`transition-all hover:shadow-md ${getStatusColor(request.requestStatus)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Wrench className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {request.sparePart.partName}
                          {getStatusBadge(request.requestStatus)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Request #{request.requestNumber} • Code: {request.sparePart.partCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requested: {request.requestedQuantity} units
                          {request.requestStatus === 'ISSUED' && request.issuedQuantity > 0 && (
                            <span className="text-green-600"> • Issued: {request.issuedQuantity} units</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {request.requestStatus === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Spare Part Request Details</DialogTitle>
                <DialogDescription>
                  Request #{selectedRequest.requestNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Spare Part</label>
                    <p>{selectedRequest.sparePart.partName}</p>
                    <p className="text-sm text-muted-foreground">Code: {selectedRequest.sparePart.partCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.requestStatus)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Requested Quantity</label>
                    <p>{selectedRequest.requestedQuantity}</p>
                  </div>
                  {selectedRequest.requestStatus === 'ISSUED' && (
                    <div>
                      <label className="text-sm font-medium">Issued Quantity</label>
                      <p className="text-green-600 font-medium">{selectedRequest.issuedQuantity}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Request Reason</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.requestReason}</p>
                </div>

                {selectedRequest.sparePart.description && (
                  <div>
                    <label className="text-sm font-medium">Spare Part Description</label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.sparePart.description}</p>
                  </div>
                )}

                {selectedRequest.approvalReason && (
                  <div>
                    <label className="text-sm font-medium">
                      {selectedRequest.approvalStatus === 'APPROVED' ? 'Approval' : 'Rejection'} Reason
                    </label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.approvalReason}</p>
                  </div>
                )}

                {selectedRequest.notes && (
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <label className="font-medium">Requested At</label>
                    <p>{new Date(selectedRequest.requestedAt).toLocaleString()}</p>
                  </div>
                  {selectedRequest.reviewedAt && (
                    <div>
                      <label className="font-medium">Reviewed At</label>
                      <p>{new Date(selectedRequest.reviewedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Request Modal */}
        <CreateSparePartRequestModal 
          open={showCreateRequest} 
          onOpenChange={setShowCreateRequest}
          onSuccess={() => {
            setShowCreateRequest(false)
            loadMyRequests()
          }}
        />
      </main>
    </div>
  )
}
