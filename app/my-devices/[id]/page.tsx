'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { getCustomerDeviceById, CustomerDevice } from '@/lib/device-service'
import { getCurrentUserRole } from '@/lib/auth'
import { motion } from 'framer-motion'
import { ServiceRequestModal } from './components/service-request-modal'
import { 
  ArrowLeft, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Calendar,
  DollarSign,
  Hash,
  Info,
  Shield,
  Wrench,
  FileText
} from 'lucide-react'

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  ERROR: 'bg-red-100 text-red-800',
  WARRANTY: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-orange-100 text-orange-800'
}

const STATUS_ICONS = {
  ACTIVE: CheckCircle,
  INACTIVE: Settings,
  ERROR: AlertTriangle,
  WARRANTY: Shield,
  EXPIRED: Clock
}

export default function DeviceDetailPage() {
  const [device, setDevice] = useState<CustomerDevice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const deviceId = params.id as string

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && role !== 'CUSTOMER') {
      router.replace('/dashboard')
    }
  }, [role, router])

  useEffect(() => {
    if (role === 'CUSTOMER' && deviceId) {
      fetchDevice()
    }
  }, [role, deviceId])

  const fetchDevice = async () => {
    try {
      setLoading(true)
      const deviceData = await getCustomerDeviceById(parseInt(deviceId))
      setDevice(deviceData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch device'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getWarrantyStatus = (device: CustomerDevice) => {
    if (device.warrantyExpired) {
      return { 
        text: 'Warranty Expired', 
        color: 'text-red-600', 
        bgColor: 'bg-red-50',
        icon: AlertTriangle 
      }
    }
    if (device.warrantyExpiringSoon) {
      return { 
        text: 'Warranty Expiring Soon', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-50',
        icon: Clock 
      }
    }
    return { 
      text: 'Under Warranty', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      icon: CheckCircle 
    }
  }

  const getDaysUntilWarrantyExpiry = (warrantyEnd?: string) => {
    if (!warrantyEnd) return null
    const endDate = new Date(warrantyEnd)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/my-devices')}>
            Back to My Devices
          </Button>
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Not Found</h2>
          <p className="text-gray-600 mb-4">The device you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/my-devices')}>
            Back to My Devices
          </Button>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[device.status as keyof typeof STATUS_ICONS] || CheckCircle
  const warrantyStatus = getWarrantyStatus(device)
  const WarrantyIcon = warrantyStatus.icon
  const daysUntilExpiry = getDaysUntilWarrantyExpiry(device.warrantyEnd)

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
            onClick={() => router.push('/my-devices')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Devices
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{device.deviceName}</h1>
        <p className="text-gray-600">
          {device.deviceModel && `${device.deviceModel}`}
          {device.serialNumber && ` • Serial: ${device.serialNumber}`}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Device Name</label>
                  <p className="text-gray-900">{device.deviceName}</p>
                </div>
                
                {device.deviceModel && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="text-gray-900">{device.deviceModel}</p>
                  </div>
                )}
                
                {device.serialNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Serial Number</label>
                    <p className="text-gray-900 font-mono">{device.serialNumber}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={STATUS_COLORS[device.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {device.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <p className="text-gray-900">{formatPrice(device.devicePrice)}</p>
                </div>
                
                {device.deviceUnit && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit</label>
                    <p className="text-gray-900">{device.deviceUnit}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warranty Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Warranty Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${warrantyStatus.bgColor} border`}>
                <div className="flex items-center gap-3 mb-3">
                  <WarrantyIcon className={`h-6 w-6 ${warrantyStatus.color}`} />
                  <span className={`font-medium ${warrantyStatus.color}`}>
                    {warrantyStatus.text}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Warranty End Date</label>
                    <p className="text-gray-900">{formatDate(device.warrantyEnd)}</p>
                  </div>
                  
                  {daysUntilExpiry !== null && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        {daysUntilExpiry > 0 ? 'Days Remaining' : 'Days Expired'}
                      </label>
                      <p className={`font-medium ${daysUntilExpiry > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(daysUntilExpiry)} days
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="text-gray-900">{formatDate(device.createdAt)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(device.updatedAt)}</p>
                </div>
              </div>
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
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setIsServiceRequestModalOpen(true)}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Request Support
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/service-requests')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Service Requests
              </Button>
              <Button className="w-full" variant="outline">
                View Documentation
              </Button>
              <Button className="w-full" variant="outline">
                Download Invoice
              </Button>
            </CardContent>
          </Card>

          {/* Device Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Device Identity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer Device ID</span>
                  <span className="font-mono text-sm">{device.id}</span>
                </div>
                {device.customerDeviceCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Device Code</span>
                    <span className="font-mono text-sm">{device.customerDeviceCode}</span>
                  </div>
                )}
                {device.contractId !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contract</span>
                    <span className="font-mono text-sm">#{device.contractId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Device Status</span>
                  <Badge className={STATUS_COLORS[device.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                    {device.status}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Warranty Status</span>
                  <Badge className={`${warrantyStatus.bgColor} ${warrantyStatus.color}`}>
                    {warrantyStatus.text}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Service Request Modal */}
      {device && (
        <ServiceRequestModal
          isOpen={isServiceRequestModalOpen}
          onClose={() => setIsServiceRequestModalOpen(false)}
          device={device}
          onSuccess={() => {
            // Optionally refresh device data or show success message
            console.log('Service request submitted successfully')
          }}
        />
      )}
    </div>
  )
} 