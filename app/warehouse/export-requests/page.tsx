'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  PackageOpen, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Wrench,
  User,
  Calendar,
  Package
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { SPARE_PARTS_SERVICE_URL } from '@/lib/api'

interface ExportRequest {
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

export default function ExportRequestsManagement() {
  const [requests, setRequests] = useState<ExportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<ExportRequest | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [approvalReason, setApprovalReason] = useState('')
  const [issueQuantity, setIssueQuantity] = useState('')
  const [issueNotes, setIssueNotes] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setUserRole(getCurrentUserRole())
    loadExportRequests()
  }, [])

  const loadExportRequests = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      
      if (!token) {
        setError('Please login to access export requests')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const params = new URLSearchParams({
        page: '0',
        size: '50',
        ...(searchTerm && { keyword: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests/search?${params}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.content || [])
      } else {
        setError('Failed to load export requests')
      }

    } catch (err) {
      console.error('Error loading export requests:', err)
      setError('Failed to load export requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadExportRequests()
  }

  const handleApproval = async () => {
    if (!selectedRequest) return

    try {
      const token = getAccessToken()
      if (!token) return

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const endpoint = actionType === 'approve' 
        ? `${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests/${selectedRequest.id}/approve`
        : `${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests/${selectedRequest.id}/reject`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: approvalReason })
      })

      if (response.ok) {
        loadExportRequests()
        setShowApprovalDialog(false)
        setSelectedRequest(null)
        setApprovalReason('')
      } else {
        setError(`Failed to ${actionType} request`)
      }
    } catch (err) {
      console.error(`Error ${actionType}ing request:`, err)
      setError(`Failed to ${actionType} request`)
    }
  }

  const handleIssue = async () => {
    if (!selectedRequest) return

    try {
      const token = getAccessToken()
      if (!token) return

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const requestBody = {
        issuedQuantity: issueQuantity ? parseInt(issueQuantity) : selectedRequest.requestedQuantity,
        notes: issueNotes
      }

      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests/${selectedRequest.id}/issue`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        loadExportRequests()
        setShowIssueDialog(false)
        setSelectedRequest(null)
        setIssueQuantity('')
        setIssueNotes('')
      } else {
        setError('Failed to issue spare parts')
      }
    } catch (err) {
      console.error('Error issuing spare parts:', err)
      setError('Failed to issue spare parts')
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

  const getPriorityColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'border-l-4 border-l-yellow-400'
      case 'APPROVED': return 'border-l-4 border-l-blue-400'
      case 'ISSUED': return 'border-l-4 border-l-green-400'
      case 'REJECTED': return 'border-l-4 border-l-red-400'
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
              <p className="text-muted-foreground">Loading export requests...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Export Requests</h1>
            <p className="text-muted-foreground">
              Review and manage spare part requests from technicians
            </p>
          </div>
          <PackageOpen className="h-8 w-8 text-primary" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.requestStatus === 'PENDING').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.requestStatus === 'APPROVED').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Issued</p>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.requestStatus === 'ISSUED').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
                <PackageOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Search by request number, technician, or spare part..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
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
                <h3 className="text-lg font-medium mb-2">No export requests found</h3>
                <p className="text-muted-foreground">
                  No spare part export requests match your search criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className={`transition-all hover:shadow-md ${getPriorityColor(request.requestStatus)}`}>
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
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.requestedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {request.requestedQuantity} units requested
                          </span>
                        </div>
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
                      
                      {userRole === 'MANAGER' && request.requestStatus === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request)
                              setActionType('approve')
                              setShowApprovalDialog(true)
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request)
                              setActionType('reject')
                              setShowApprovalDialog(true)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {(userRole === 'MANAGER' || userRole === 'STAFF') && request.requestStatus === 'APPROVED' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIssueQuantity(request.requestedQuantity.toString())
                            setShowIssueDialog(true)
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Issue Parts
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
        {selectedRequest && !showApprovalDialog && !showIssueDialog && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Export Request Details</DialogTitle>
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
                    <label className="text-sm font-medium">Technician</label>
                    <p>{selectedRequest.requestedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Requested Quantity</label>
                    <p>{selectedRequest.requestedQuantity}</p>
                  </div>
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

                {selectedRequest.requestStatus === 'ISSUED' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Issued Quantity</label>
                      <p className="text-green-600 font-medium">{selectedRequest.issuedQuantity}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Issued By</label>
                      <p>{selectedRequest.issuedBy}</p>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Approval Dialog */}
        {showApprovalDialog && selectedRequest && (
          <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === 'approve' ? 'Approve' : 'Reject'} Request
                </DialogTitle>
                <DialogDescription>
                  Request #{selectedRequest.requestNumber} for {selectedRequest.sparePart.partName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">
                    {actionType === 'approve' ? 'Approval' : 'Rejection'} Reason
                  </Label>
                  <Textarea
                    id="reason"
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder={`Please provide a reason for ${actionType === 'approve' ? 'approving' : 'rejecting'} this request...`}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApproval}
                    className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                    variant={actionType === 'reject' ? 'destructive' : 'default'}
                  >
                    {actionType === 'approve' ? 'Approve' : 'Reject'} Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Issue Dialog */}
        {showIssueDialog && selectedRequest && (
          <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue Spare Parts</DialogTitle>
                <DialogDescription>
                  Issue parts for request #{selectedRequest.requestNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="issueQuantity">Quantity to Issue</Label>
                  <Input
                    id="issueQuantity"
                    type="number"
                    min="1"
                    max={selectedRequest.requestedQuantity}
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Requested: {selectedRequest.requestedQuantity} units
                  </p>
                </div>
                <div>
                  <Label htmlFor="issueNotes">Notes (optional)</Label>
                  <Textarea
                    id="issueNotes"
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    placeholder="Any additional notes about this issuance..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleIssue} className="bg-blue-600 hover:bg-blue-700">
                    Issue Parts
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
