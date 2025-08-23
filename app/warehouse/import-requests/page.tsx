'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Truck, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Package,
  Wrench,
  RefreshCw
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { DEVICE_SERVICE_URL, SPARE_PARTS_SERVICE_URL } from '@/lib/api'
import CreateDeviceImportRequestModal from './components/create-device-import-request-modal'
import CreateSparePartImportRequestModal from './components/create-spare-part-import-request-modal'

interface ImportRequest {
  id: number
  requestNumber: string
  requestedQuantity: number
  unitPrice?: number
  totalAmount?: number
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  approvalStatus?: 'APPROVED' | 'REJECTED'
  requestReason: string
  requestedBy: string
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
  approvalReason?: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  invoiceNumber?: string
  notes?: string
  type: 'device' | 'spare-part'
  device?: {
    id: number
    name: string
    model: string
  }
  sparePart?: {
    id: number
    name?: string
    code?: string
    partName?: string
    partCode?: string
  }
  supplier?: {
    id: number
    companyName: string
  }
}

export default function ImportRequestsManagement() {
  const [deviceRequests, setDeviceRequests] = useState<ImportRequest[]>([])
  const [sparePartRequests, setSparePartRequests] = useState<ImportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<ImportRequest | null>(null)
  const [showCreateDevice, setShowCreateDevice] = useState(false)
  const [showCreateSparePart, setShowCreateSparePart] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setUserRole(getCurrentUserRole())
    loadImportRequests()
  }, [])

  const loadImportRequests = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      
      if (!token) {
        setError('Please login to access import requests')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load device import requests
      try {
        const deviceParams = new URLSearchParams({
          page: '0',
          size: '50',
          ...(searchTerm && { keyword: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter })
        })
        
        const deviceResponse = await fetch(`${DEVICE_SERVICE_URL}/warehouse/import-requests/search?${deviceParams}`, { headers })
        if (deviceResponse.ok) {
          const deviceData = await deviceResponse.json()
          const deviceRequestsWithType: ImportRequest[] = (deviceData.content || []).map((req: any) => ({
            ...req,
            type: 'device' as const
          }))
          setDeviceRequests(deviceRequestsWithType)
        }
      } catch (err) {
        console.warn('Failed to load device import requests:', err)
      }

      // Load spare part import requests
      try {
        const spareParams = new URLSearchParams({
          page: '0',
          size: '50',
          ...(searchTerm && { keyword: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter })
        })
        const spareResponse = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/import-requests/search?${spareParams}`, { headers })
        if (spareResponse.ok) {
          const spareData = await spareResponse.json()
          console.log('Spare parts import requests response:', spareData)
          const mapped: ImportRequest[] = (spareData.content || []).map((req: any) => ({
            ...req,
            type: 'spare-part' as const,
            sparePart: {
              id: req.sparePart?.id || req.sparePartId,
              name: req.sparePart?.partName || req.sparePartName,
              code: req.sparePart?.partCode || req.sparePartCode,
              partName: req.sparePart?.partName || req.sparePartName,
              partCode: req.sparePart?.partCode || req.sparePartCode
            }
          }))
          setSparePartRequests(mapped)
          console.log('Processed spare parts import requests:', mapped)
        } else {
          console.error('Spare parts import requests response not ok:', spareResponse.status, spareResponse.statusText)
        }
      } catch (err) {
        console.warn('Failed to load spare part import requests:', err)
      }

    } catch (err) {
      console.error('Error loading import requests:', err)
      setError('Failed to load import requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadImportRequests()
  }

  const handleApproval = async (requestId: number, action: 'approve' | 'reject', reason: string, type: 'device' | 'spare-part') => {
    try {
      const token = getAccessToken()
      if (!token) return

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const endpoint = type === 'device' 
        ? `${DEVICE_SERVICE_URL}/warehouse/import-requests/${requestId}/${action}`
        : `${SPARE_PARTS_SERVICE_URL}/warehouse/import-requests/${requestId}/${action}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        loadImportRequests()
        setSelectedRequest(null)
      } else {
        setError(`Failed to ${action} request`)
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err)
      setError(`Failed to ${action} request`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderRequestCard = (request: ImportRequest) => (
    <Card key={request.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {request.type === 'device' ? (
              <Package className="h-8 w-8 text-blue-500" />
            ) : (
              <Wrench className="h-8 w-8 text-green-500" />
            )}
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {request.type === 'device' 
                  ? request.device?.name 
                  : (request.sparePart?.name || request.sparePart?.partName || '')}
                {getStatusBadge(request.requestStatus)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Request #{request.requestNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                Quantity: {request.requestedQuantity} 
                {request.unitPrice && ` • $${request.unitPrice} each`}
                {request.totalAmount && ` • Total: $${request.totalAmount}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Requested by {request.requestedBy} on {new Date(request.requestedAt).toLocaleDateString()}
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
            
            {userRole === 'MANAGER' && request.requestStatus === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApproval(request.id, 'approve', 'Approved', request.type)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection:')
                    if (reason) {
                      handleApproval(request.id, 'reject', reason, request.type)
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="ml-60 flex-1 bg-background p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading import requests...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Import Requests</h1>
            <p className="text-muted-foreground">
              Manage device and spare parts import requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadImportRequests}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Truck className="h-8 w-8 text-primary" />
            {userRole === 'STAFF' && (
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateDevice(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Devices
                </Button>
                <Button variant="outline" onClick={() => setShowCreateSparePart(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Spare Parts
                </Button>
              </div>
            )}
          </div>
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
                  placeholder="Search by request number, item name..."
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
                  <SelectItem value="COMPLETED">Completed</SelectItem>
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

        {/* Requests Tabs */}
        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Device Requests ({deviceRequests.length})
            </TabsTrigger>
            <TabsTrigger value="spare-parts" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Spare Part Requests ({sparePartRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>Device Import Requests</CardTitle>
                <CardDescription>
                  Requests for importing devices into inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deviceRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No device import requests found
                  </div>
                ) : (
                  deviceRequests.map(renderRequestCard)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spare-parts">
            <Card>
              <CardHeader>
                <CardTitle>Spare Part Import Requests</CardTitle>
                <CardDescription>
                  Requests for importing spare parts into inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sparePartRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No spare part import requests found
                  </div>
                ) : (
                  sparePartRequests.map(renderRequestCard)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Request Details</DialogTitle>
                <DialogDescription>
                  Request #{selectedRequest.requestNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Item</label>
                    <p>{selectedRequest.type === 'device' ? selectedRequest.device?.name : selectedRequest.sparePart?.partName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.requestStatus)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <p>{selectedRequest.requestedQuantity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Price</label>
                    <p>${selectedRequest.unitPrice || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.requestReason}</p>
                </div>
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
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Modals */}
        <CreateDeviceImportRequestModal 
          open={showCreateDevice} 
          onOpenChange={setShowCreateDevice}
          onSuccess={() => {
            setShowCreateDevice(false)
            loadImportRequests()
          }}
        />
        
        <CreateSparePartImportRequestModal 
          open={showCreateSparePart} 
          onOpenChange={setShowCreateSparePart}
          onSuccess={() => {
            setShowCreateSparePart(false)
            loadImportRequests()
          }}
        />
      </main>
    </div>
  )
}
