'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Database, Wrench, Search, Package, AlertTriangle, Filter, RefreshCw } from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { getAccessToken } from '@/lib/auth'
import { DEVICE_SERVICE_URL, SPARE_PARTS_SERVICE_URL } from '@/lib/api'

interface InventoryItem {
  id: number
  name?: string
  partName?: string
  partCode?: string
  quantityInStock: number
  minimumStockLevel: number
  maximumStockLevel: number
  type: 'device' | 'spare-part'
  device?: {
    id: number
    name: string
    model: string
    serialNumber: string
  }
  sparePart?: {
    id: number
    partName: string
    partCode: string
    description: string
  }
}

export default function InventoryOverview() {
  const [deviceInventory, setDeviceInventory] = useState<InventoryItem[]>([])
  const [sparePartInventory, setSparePartInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'low-stock' | 'out-of-stock'>('all')

  useEffect(() => {
    loadInventoryData()
  }, [])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      
      if (!token) {
        setError('Please login to access inventory data')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load device inventory
      try {
        const deviceParams = new URLSearchParams({
          page: '0',
          size: '100',
          ...(searchTerm && { keyword: searchTerm }),
          ...(filterType === 'low-stock' && { lowStock: 'true' }),
          ...(filterType === 'out-of-stock' && { outOfStock: 'true' })
        })
        
        const deviceResponse = await fetch(`${DEVICE_SERVICE_URL}/warehouse/inventory/search?${deviceParams}`, { headers })
        if (deviceResponse.ok) {
          const deviceData = await deviceResponse.json()
          console.log('Device inventory response:', deviceData)
          const deviceItems: InventoryItem[] = deviceData.content?.map((item: any) => ({
            id: item.device.id,
            type: 'device' as const,
            quantityInStock: item.quantityInStock || 0,
            minimumStockLevel: item.minimumStockLevel || 5,
            maximumStockLevel: item.maximumStockLevel || 100,
            device: item.device
          })) || []
          setDeviceInventory(deviceItems)
          console.log('Processed device items:', deviceItems)
        } else {
          console.error('Device inventory response not ok:', deviceResponse.status, deviceResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load device inventory:', err)
      }

      // Load spare parts inventory
      try {
        const sparePartParams = new URLSearchParams({
          page: '0',
          size: '100',
          ...(searchTerm && { keyword: searchTerm }),
          ...(filterType === 'low-stock' && { lowStock: 'true' }),
          ...(filterType === 'out-of-stock' && { outOfStock: 'true' })
        })
        
        const sparePartResponse = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/inventory/search?${sparePartParams}`, { headers })
        if (sparePartResponse.ok) {
          const sparePartData = await sparePartResponse.json()
          console.log('Spare parts inventory response:', sparePartData)
          const sparePartItems: InventoryItem[] = sparePartData.content?.map((item: any) => ({
            id: item.sparePartId ?? item.sparePart?.id,
            type: 'spare-part' as const,
            quantityInStock: item.quantityInStock || 0,
            minimumStockLevel: item.minimumStockLevel || 10,
            maximumStockLevel: item.maximumStockLevel || 500,
            sparePart: {
              id: item.sparePartId ?? item.sparePart?.id,
              partName: item.partName ?? item.sparePart?.partName,
              partCode: item.partCode ?? item.sparePart?.partCode,
              description: item.description ?? item.sparePart?.description,
            }
          })) || []
          setSparePartInventory(sparePartItems)
          console.log('Processed spare part items:', sparePartItems)
        } else {
          console.error('Spare parts inventory response not ok:', sparePartResponse.status, sparePartResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load spare part inventory:', err)
      }

    } catch (err) {
      console.error('Error loading inventory data:', err)
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadInventoryData()
  }

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: 'Out of Stock', variant: 'destructive' as const }
    if (current <= minimum) return { label: 'Low Stock', variant: 'destructive' as const }
    return { label: 'In Stock', variant: 'default' as const }
  }

  const renderInventoryTable = (items: InventoryItem[], type: 'device' | 'spare-part') => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No {type === 'device' ? 'devices' : 'spare parts'} found
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={`${type}-${item.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {type === 'device' ? (
                    <Database className="h-8 w-8 text-blue-500" />
                  ) : (
                    <Wrench className="h-8 w-8 text-green-500" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {type === 'device' ? item.device?.name : item.sparePart?.partName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {type === 'device' 
                        ? `Model: ${item.device?.model}` 
                        : `Code: ${item.sparePart?.partCode}`
                      }
                    </p>
                    {type === 'spare-part' && item.sparePart?.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.sparePart.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{item.quantityInStock}</div>
                    <div className="text-xs text-muted-foreground">Current Stock</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium">{item.minimumStockLevel}</div>
                    <div className="text-xs text-muted-foreground">Min Level</div>
                  </div>
                  
                  <div className="text-center">
                    <Badge {...getStockStatus(item.quantityInStock, item.minimumStockLevel)}>
                      {getStockStatus(item.quantityInStock, item.minimumStockLevel).label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="ml-60 flex-1 bg-background p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading inventory data...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Inventory Overview</h1>
            <p className="text-muted-foreground">
              Detailed view of all inventory items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadInventoryData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Package className="h-8 w-8 text-primary" />
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
                  placeholder="Search by name, model, part code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Tabs */}
        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Devices ({deviceInventory.length})
            </TabsTrigger>
            <TabsTrigger value="spare-parts" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Spare Parts ({sparePartInventory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>Device Inventory</CardTitle>
                <CardDescription>
                  All devices currently in the warehouse
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderInventoryTable(deviceInventory, 'device')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spare-parts">
            <Card>
              <CardHeader>
                <CardTitle>Spare Parts Inventory</CardTitle>
                <CardDescription>
                  All spare parts currently in the warehouse
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderInventoryTable(sparePartInventory, 'spare-part')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
