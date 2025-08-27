'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, 
  Wrench, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { 
  getDeviceInventoryOverview, 
  getLowStockDevices, 
  getDevicesNeedingReorder,
  searchDeviceInventory,
  getSparePartsInventory,
  getSparePartsWithInventory,
  DeviceInventory,
  SparePartInventory
} from '@/lib/api/inventory'
import { isAuthenticated, testAuthentication } from '@/lib/api/client'

export default function InventoryPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('devices')
  const [searchTerm, setSearchTerm] = useState('')
  const [deviceInventory, setDeviceInventory] = useState<DeviceInventory[]>([])
  const [sparePartInventory, setSparePartInventory] = useState<SparePartInventory[]>([])
  const [filteredDevices, setFilteredDevices] = useState<DeviceInventory[]>([])
  const [filteredSpareParts, setFilteredSpareParts] = useState<SparePartInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      console.log('User not authenticated, redirecting to login')
      router.push('/login')
      return
    }
    
    console.log('User authenticated, testing authentication status')
    testAuthentication()
    
    loadInventoryData()
  }, [router])

  useEffect(() => {
    filterInventory()
  }, [searchTerm, deviceInventory, sparePartInventory])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading inventory data...')
      
      // Load device inventory
      console.log('Calling getDeviceInventoryOverview...')
      const devices = await getDeviceInventoryOverview()
      console.log('Device inventory loaded:', devices)
      setDeviceInventory(devices)
      
      // Load spare part inventory
      try {
        console.log('Calling getSparePartsWithInventory...')
        const sparePartsInventory = await getSparePartsWithInventory()
        console.log('Spare parts with inventory loaded:', sparePartsInventory)
        setSparePartInventory(sparePartsInventory)
      } catch (error) {
        console.warn('Failed to load spare parts inventory, using empty array:', error)
        setSparePartInventory([])
      }
      
    } catch (err) {
      console.error('Error loading inventory data:', err)
      setError('Failed to load inventory data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterInventory = () => {
    const term = searchTerm.toLowerCase()
    
    // Filter devices
    const filteredDevs = deviceInventory.filter(device =>
      device.deviceName.toLowerCase().includes(term) ||
      device.deviceModel.toLowerCase().includes(term) ||
      device.deviceSerialNumber.toLowerCase().includes(term) ||
      device.warehouseLocation?.toLowerCase().includes(term)
    )
    setFilteredDevices(filteredDevs)
    
    // Filter spare parts
    const filteredParts = sparePartInventory.filter(part =>
      part.sparePartName.toLowerCase().includes(term) ||
      part.sparePartModel.toLowerCase().includes(term) ||
      part.warehouseLocation?.toLowerCase().includes(term)
    )
    setFilteredSpareParts(filteredParts)
  }

  const getStockStatusBadge = (item: DeviceInventory | SparePartInventory) => {
    if (item.isOutOfStock) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (item.isLowStock) {
      return <Badge variant="secondary">Low Stock</Badge>
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>
    }
  }

  const getStockStatusIcon = (item: DeviceInventory | SparePartInventory) => {
    if (item.isOutOfStock) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    } else if (item.isLowStock) {
      return <TrendingDown className="h-4 w-4 text-yellow-600" />
    } else {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Inventory</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <Button 
            onClick={loadInventoryData} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Overview</h1>
        <p className="text-muted-foreground">
          Monitor stock levels for devices and spare parts
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, model, serial number, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </Button>
      </div>

      {/* Inventory Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Devices ({filteredDevices.length})
          </TabsTrigger>
          <TabsTrigger value="spare-parts" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Spare Parts ({filteredSpareParts.length})
          </TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={`${device.deviceId}`}>
                    <TableCell className="font-medium">{device.deviceName}</TableCell>
                    <TableCell>{device.deviceModel}</TableCell>
                    <TableCell>{device.deviceSerialNumber}</TableCell>
                    <TableCell>{device.quantityInStock}</TableCell>
                    <TableCell>{device.minimumStockLevel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStockStatusIcon(device)}
                        {getStockStatusBadge(device)}
                      </div>
                    </TableCell>
                    <TableCell>{device.warehouseLocation || '-'}</TableCell>
                    <TableCell>{device.unitCost ? formatCurrency(device.unitCost) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No devices in inventory yet.'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Spare Parts Tab */}
        <TabsContent value="spare-parts" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpareParts.map((part, idx) => (
                  <TableRow key={`${part.sparePartId}-${idx}`}>
                    <TableCell className="font-medium">{part.sparePartName}</TableCell>
                    <TableCell>{part.sparePartModel}</TableCell>
                    <TableCell>{part.quantityInStock}</TableCell>
                    <TableCell>{part.minimumStockLevel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStockStatusIcon(part)}
                        {getStockStatusBadge(part)}
                      </div>
                    </TableCell>
                    <TableCell>{part.warehouseLocation || '-'}</TableCell>
                    <TableCell>{part.unitCost ? formatCurrency(part.unitCost) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredSpareParts.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No spare parts found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No spare parts in inventory yet.'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
