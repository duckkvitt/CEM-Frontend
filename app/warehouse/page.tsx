'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  PackageOpen,
  History,
  Warehouse as WarehouseIcon,
  Database,
  Wrench,
  RefreshCw
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { DEVICE_SERVICE_URL, SPARE_PARTS_SERVICE_URL } from '@/lib/api'

interface InventoryStats {
  totalItems: number
  totalQuantity: number
  lowStockCount: number
  outOfStockCount: number
  totalValue?: number
  activeDeviceTypesCount?: number
  activeSparePartTypesCount?: number
}

interface ImportRequestStats {
  totalRequests: number
  pendingCount: number
  approvedCount: number
  completedCount: number
  rejectedCount: number
  totalValue: number
}

interface ExportRequestStats {
  totalRequests: number
  pendingCount: number
  approvedCount: number
  issuedCount: number
  rejectedCount: number
  totalIssued: number
}

interface LowStockItem {
  id: number
  name: string
  partName?: string
  partCode?: string
  currentStock: number
  minimumLevel: number
  type: 'device' | 'spare-part'
}

export default function WarehouseDashboard() {
  const [deviceStats, setDeviceStats] = useState<InventoryStats | null>(null)
  const [sparePartStats, setSparePartStats] = useState<InventoryStats | null>(null)
  const [deviceImportStats, setDeviceImportStats] = useState<ImportRequestStats | null>(null)
  const [sparePartExportStats, setSparePartExportStats] = useState<ExportRequestStats | null>(null)
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statsLoading, setStatsLoading] = useState({
    devices: false,
    spareParts: false,
    deviceImport: false,
    sparePartExport: false,
    lowStock: false
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setLowStockItems([]) // Clear existing items before loading new ones
      const token = getAccessToken()
      
      if (!token) {
        setError('Please login to access warehouse data')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load device inventory statistics
      try {
        setStatsLoading(prev => ({ ...prev, devices: true }))
        const deviceStatsResponse = await fetch(`${DEVICE_SERVICE_URL}/warehouse/inventory/statistics`, { headers })
        if (deviceStatsResponse.ok) {
          const deviceStatsData = await deviceStatsResponse.json()
          console.log('Device stats response:', deviceStatsData)
          setDeviceStats(deviceStatsData)
        } else {
          console.error('Device stats response not ok:', deviceStatsResponse.status, deviceStatsResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load device stats:', err)
      } finally {
        setStatsLoading(prev => ({ ...prev, devices: false }))
      }

      // Load spare parts inventory statistics  
      try {
        const sparePartStatsResponse = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/inventory/statistics`, { headers })
        if (sparePartStatsResponse.ok) {
          const sparePartStatsData = await sparePartStatsResponse.json()
          console.log('Spare parts stats response:', sparePartStatsData)
          setSparePartStats(sparePartStatsData)
        } else {
          console.error('Spare parts stats response not ok:', sparePartStatsResponse.status, sparePartStatsResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load spare part stats:', err)
      }

      // Load device import request statistics
      try {
        const deviceImportResponse = await fetch(`${DEVICE_SERVICE_URL}/warehouse/import-requests/statistics`, { headers })
        if (deviceImportResponse.ok) {
          const deviceImportData = await deviceImportResponse.json()
          setDeviceImportStats(deviceImportData)
        }
      } catch (err) {
        console.warn('Failed to load device import stats:', err)
      }

      // Load spare part export request statistics
      try {
        const sparePartExportResponse = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests/statistics`, { headers })
        if (sparePartExportResponse.ok) {
          const sparePartExportData = await sparePartExportResponse.json()
          setSparePartExportStats(sparePartExportData)
        }
      } catch (err) {
        console.warn('Failed to load spare part export stats:', err)
      }

      // Load low stock items (devices)
      try {
        const deviceLowStockResponse = await fetch(`${DEVICE_SERVICE_URL}/warehouse/inventory/low-stock`, { headers })
        if (deviceLowStockResponse.ok) {
          const deviceLowStockData = await deviceLowStockResponse.json()
          console.log('Device low stock response:', deviceLowStockData)
          const deviceLowStock: LowStockItem[] = deviceLowStockData.map((item: any) => ({
            id: item.device.id,
            name: item.device.name,
            currentStock: item.quantityInStock || 0,
            minimumLevel: item.minimumStockLevel || 5,
            type: 'device' as const
          }))
          console.log('Processed device low stock items:', deviceLowStock)
          setLowStockItems(prev => [...prev, ...deviceLowStock])
        } else {
          console.error('Device low stock response not ok:', deviceLowStockResponse.status, deviceLowStockResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load device low stock items:', err)
      }

      // Load low stock items (spare parts)
      try {
        const sparePartLowStockResponse = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/inventory/low-stock`, { headers })
        if (sparePartLowStockResponse.ok) {
          const sparePartLowStockData = await sparePartLowStockResponse.json()
          console.log('Spare parts low stock response:', sparePartLowStockData)
          // API returns flat DTO from spare-parts service: { inventoryId, sparePartId, sparePartName, sparePartCode, quantityInStock, minimumStockLevel }
          const sparePartLowStock: LowStockItem[] = sparePartLowStockData.map((item: any) => {
            const nested = item?.sparePart
            if (nested) {
              return {
                id: nested.id,
                partName: nested.partName,
                partCode: nested.partCode,
                currentStock: item.quantityInStock || 0,
                minimumLevel: item.minimumStockLevel || 10,
                type: 'spare-part' as const
              }
            }
            return {
              id: item.sparePartId,
              partName: item.sparePartName,
              partCode: item.sparePartCode,
              currentStock: item.quantityInStock || 0,
              minimumLevel: item.minimumStockLevel || 10,
              type: 'spare-part' as const
            }
          })
          console.log('Processed spare parts low stock items:', sparePartLowStock)
          setLowStockItems(prev => [...prev, ...sparePartLowStock])
        } else {
          console.error('Spare parts low stock response not ok:', sparePartLowStockResponse.status, sparePartLowStockResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load spare part low stock items:', err)
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load warehouse dashboard data')
    } finally {
      setLoading(false)
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
              <p className="text-muted-foreground">Loading warehouse dashboard...</p>
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

  // Helper function to safely get numeric values
  const safeNumber = (value: any, defaultValue: number = 0) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return defaultValue
    }
    return Number(value)
  }

  const totalLowStockCount = safeNumber(deviceStats?.lowStockCount, 0) + safeNumber(sparePartStats?.lowStockCount, 0)
  const totalOutOfStockCount = safeNumber(deviceStats?.outOfStockCount, 0) + safeNumber(sparePartStats?.outOfStockCount, 0)
  const totalPendingRequests = safeNumber(deviceImportStats?.pendingCount, 0) + safeNumber(sparePartExportStats?.pendingCount, 0)

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouse Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive overview of inventory, requests, and warehouse operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDashboardData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <WarehouseIcon className="h-8 w-8 text-primary" />
            <Badge variant="outline" className="text-lg px-3 py-1">
              Management View
            </Badge>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading.devices || statsLoading.spareParts ? (
                <div className="flex items-center justify-center h-16">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {safeNumber(deviceStats?.totalItems, 0) + safeNumber(sparePartStats?.totalItems, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {safeNumber(deviceStats?.totalItems, 0)} devices, {safeNumber(sparePartStats?.totalItems, 0)} spare parts
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalLowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Items below minimum level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalOutOfStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Items completely out of stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalPendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Device Inventory
              </CardTitle>
              <CardDescription>
                Current status of device inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Devices</span>
                <Badge>{safeNumber(deviceStats?.totalItems, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Quantity</span>
                <Badge variant="secondary">{safeNumber(deviceStats?.totalQuantity, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Low Stock</span>
                <Badge variant="destructive">{safeNumber(deviceStats?.lowStockCount, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Out of Stock</span>
                <Badge variant="destructive">{safeNumber(deviceStats?.outOfStockCount, 0)}</Badge>
              </div>
              {deviceStats?.totalValue && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Value</span>
                  <Badge variant="outline">${safeNumber(deviceStats.totalValue, 0).toLocaleString()}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Spare Parts Inventory
              </CardTitle>
              <CardDescription>
                Current status of spare parts inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Spare Parts</span>
                <Badge>{safeNumber(sparePartStats?.totalItems, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Quantity</span>
                <Badge variant="secondary">{safeNumber(sparePartStats?.totalQuantity, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Low Stock</span>
                <Badge variant="destructive">{safeNumber(sparePartStats?.lowStockCount, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Out of Stock</span>
                <Badge variant="destructive">{safeNumber(sparePartStats?.outOfStockCount, 0)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Management Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Device Import Requests
              </CardTitle>
              <CardDescription>
                Status of device import requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Requests</span>
                <Badge>{deviceImportStats?.totalRequests || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending Review</span>
                <Badge variant="outline">{deviceImportStats?.pendingCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Approved</span>
                <Badge variant="secondary">{deviceImportStats?.approvedCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completed</span>
                <Badge className="bg-green-100 text-green-800">{deviceImportStats?.completedCount || 0}</Badge>
              </div>
              {deviceImportStats?.totalValue && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Value</span>
                  <Badge variant="outline">${deviceImportStats.totalValue.toLocaleString()}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageOpen className="h-5 w-5" />
                Spare Parts Export Requests
              </CardTitle>
              <CardDescription>
                Technician requests for spare parts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Requests</span>
                <Badge>{sparePartExportStats?.totalRequests || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending Review</span>
                <Badge variant="outline">{sparePartExportStats?.pendingCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Approved</span>
                <Badge variant="secondary">{sparePartExportStats?.approvedCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Issued</span>
                <Badge className="bg-green-100 text-green-800">{sparePartExportStats?.issuedCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Issued</span>
                <Badge variant="outline">{sparePartExportStats?.totalIssued || 0} units</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert Section */}
        {lowStockItems.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>
                Items that require immediate attention due to low inventory levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item, index) => (
                  <div key={`${item.type}-${item.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.type === 'device' ? (
                        <Database className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Wrench className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {item.type === 'device' ? item.name : item.partName}
                        </p>
                        {item.partCode && (
                          <p className="text-sm text-muted-foreground">Code: {item.partCode}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {item.currentStock} / {item.minimumLevel}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current / Minimum
                      </p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {lowStockItems.length - 5} more items
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-medium mb-2">Device Stats:</h4>
                  <pre className="bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(deviceStats, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Spare Parts Stats:</h4>
                  <pre className="bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(sparePartStats, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Low Stock Items:</h4>
                  <pre className="bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(lowStockItems, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Loading States:</h4>
                  <pre className="bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(statsLoading, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common warehouse management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/warehouse/inventory">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm">View Inventory</span>
                </Button>
              </Link>
              <Link href="/warehouse/import-requests">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Truck className="h-5 w-5" />
                  <span className="text-sm">Import Requests</span>
                </Button>
              </Link>
              <Link href="/warehouse/export-requests">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <PackageOpen className="h-5 w-5" />
                  <span className="text-sm">Export Requests</span>
                </Button>
              </Link>
              <Link href="/warehouse/transactions">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <History className="h-5 w-5" />
                  <span className="text-sm">Transactions</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
