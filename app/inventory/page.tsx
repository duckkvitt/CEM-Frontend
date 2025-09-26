'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { AdvancedFilter, FilterOptions } from '@/components/ui/advanced-filter'
import { 
  Package, 
  Wrench, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { isAuthenticated } from '@/lib/auth'
import { testAuthentication } from '@/lib/api/client'

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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Advanced filter states
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    stockStatus: 'all',
    itemType: 'all',
    location: 'all',
    minStock: '',
    maxStock: '',
    minCost: '',
    maxCost: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  
  // Available locations for filter
  const availableLocations = useMemo(() => {
    const locations = new Set<string>()
    deviceInventory.forEach(device => {
      if (device.warehouseLocation) locations.add(device.warehouseLocation)
    })
    sparePartInventory.forEach(part => {
      if (part.warehouseLocation) locations.add(part.warehouseLocation)
    })
    return Array.from(locations).sort()
  }, [deviceInventory, sparePartInventory])

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
  }, [searchTerm, deviceInventory, sparePartInventory, filters])

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
    const term = (filters.searchTerm || searchTerm).toLowerCase()
    
    // Filter devices
    let filteredDevs = deviceInventory.filter(device => {
      // Search term filter
      if (term && !(
        device.deviceName.toLowerCase().includes(term) ||
        device.deviceModel.toLowerCase().includes(term) ||
        device.deviceSerialNumber.toLowerCase().includes(term) ||
        device.warehouseLocation?.toLowerCase().includes(term)
      )) {
        return false
      }
      
      // Stock status filter
      if (filters.stockStatus !== 'all') {
        switch (filters.stockStatus) {
          case 'in-stock':
            if (device.isOutOfStock || device.isLowStock) return false
            break
          case 'low-stock':
            if (!device.isLowStock) return false
            break
          case 'out-of-stock':
            if (!device.isOutOfStock) return false
            break
        }
      }
      
      // Location filter
      if (filters.location !== 'all' && device.warehouseLocation !== filters.location) {
        return false
      }
      
      // Stock range filter
      if (filters.minStock && device.quantityInStock < parseInt(filters.minStock)) {
        return false
      }
      if (filters.maxStock && device.quantityInStock > parseInt(filters.maxStock)) {
        return false
      }
      
      // Cost range filter
      if (filters.minCost && device.unitCost < parseFloat(filters.minCost)) {
        return false
      }
      if (filters.maxCost && device.unitCost > parseFloat(filters.maxCost)) {
        return false
      }
      
      return true
    })
    
    // Filter spare parts
    let filteredParts = sparePartInventory.filter(part => {
      // Search term filter
      if (term && !(
        part.sparePartName.toLowerCase().includes(term) ||
        part.sparePartModel.toLowerCase().includes(term) ||
        part.warehouseLocation?.toLowerCase().includes(term)
      )) {
        return false
      }
      
      // Stock status filter
      if (filters.stockStatus !== 'all') {
        switch (filters.stockStatus) {
          case 'in-stock':
            if (part.isOutOfStock || part.isLowStock) return false
            break
          case 'low-stock':
            if (!part.isLowStock) return false
            break
          case 'out-of-stock':
            if (!part.isOutOfStock) return false
            break
        }
      }
      
      // Location filter
      if (filters.location !== 'all' && part.warehouseLocation !== filters.location) {
        return false
      }
      
      // Stock range filter
      if (filters.minStock && part.quantityInStock < parseInt(filters.minStock)) {
        return false
      }
      if (filters.maxStock && part.quantityInStock > parseInt(filters.maxStock)) {
        return false
      }
      
      // Cost range filter
      if (filters.minCost && part.unitCost < parseFloat(filters.minCost)) {
        return false
      }
      if (filters.maxCost && part.unitCost > parseFloat(filters.maxCost)) {
        return false
      }
      
      return true
    })
    
    // Sort items
    const sortItems = (items: any[], isDevice: boolean) => {
      return items.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (filters.sortBy) {
          case 'name':
            aValue = isDevice ? a.deviceName : a.sparePartName
            bValue = isDevice ? b.deviceName : b.sparePartName
            break
          case 'model':
            aValue = isDevice ? a.deviceModel : a.sparePartModel
            bValue = isDevice ? b.deviceModel : b.sparePartModel
            break
          case 'stock':
            aValue = a.quantityInStock
            bValue = b.quantityInStock
            break
          case 'cost':
            aValue = a.unitCost
            bValue = b.unitCost
            break
          case 'location':
            aValue = a.warehouseLocation || ''
            bValue = b.warehouseLocation || ''
            break
          case 'created':
            aValue = new Date(a.createdAt)
            bValue = new Date(b.createdAt)
            break
          default:
            aValue = isDevice ? a.deviceName : a.sparePartName
            bValue = isDevice ? b.deviceName : b.sparePartName
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return filters.sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        
        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }
    
    filteredDevs = sortItems(filteredDevs, true)
    filteredParts = sortItems(filteredParts, false)
    
    setFilteredDevices(filteredDevs)
    setFilteredSpareParts(filteredParts)
    setCurrentPage(1) // Reset to first page when filters change
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

  // Pagination logic
  const getCurrentItems = () => {
    const items = activeTab === 'devices' ? filteredDevices : filteredSpareParts
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    const items = activeTab === 'devices' ? filteredDevices : filteredSpareParts
    return Math.ceil(items.length / itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.searchTerm) count++
    if (filters.stockStatus !== 'all') count++
    if (filters.itemType !== 'all') count++
    if (filters.location !== 'all') count++
    if (filters.minStock || filters.maxStock) count++
    if (filters.minCost || filters.maxCost) count++
    if (filters.sortBy !== 'name' || filters.sortOrder !== 'asc') count++
    return count
  }

  const clearFilter = (filterKey: keyof FilterOptions) => {
    const newFilters = { ...filters, [filterKey]: filterKey === 'sortBy' ? 'name' : filterKey === 'sortOrder' ? 'asc' : 'all' }
    setFilters(newFilters)
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
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, model, serial number, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 relative"
                onClick={() => setShowAdvancedFilter(true)}
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Active filters:</span>
                {filters.searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {filters.searchTerm}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('searchTerm')} />
                  </Badge>
                )}
                {filters.stockStatus !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {filters.stockStatus.replace('-', ' ')}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('stockStatus')} />
                  </Badge>
                )}
                {filters.location !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Location: {filters.location}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('location')} />
                  </Badge>
                )}
                {(filters.minStock || filters.maxStock) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Stock: {filters.minStock || '0'} - {filters.maxStock || '∞'}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                      clearFilter('minStock')
                      clearFilter('maxStock')
                    }} />
                  </Badge>
                )}
                {(filters.minCost || filters.maxCost) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Cost: {filters.minCost || '0'} - {filters.maxCost || '∞'} VND
                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                      clearFilter('minCost')
                      clearFilter('maxCost')
                    }} />
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentItems().map((device, index) => (
                  <motion.tr
                    key={device.deviceId ? `device-${device.deviceId}` : `device-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
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
                  </motion.tr>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentItems().map((part, idx) => (
                  <motion.tr
                    key={part.sparePartId ? `sparepart-${part.sparePartId}` : `sparepart-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
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
                  </motion.tr>
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

      {/* Pagination */}
      {getTotalPages() > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, activeTab === 'devices' ? filteredDevices.length : filteredSpareParts.length)} of {activeTab === 'devices' ? filteredDevices.length : filteredSpareParts.length} items
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) handlePageChange(currentPage - 1)
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => {
                    if (getTotalPages() <= 7 || page === 1 || page === getTotalPages() || Math.abs(page - currentPage) <= 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(page)
                            }}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (page === 2 || page === getTotalPages() - 1) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < getTotalPages()) handlePageChange(currentPage + 1)
                      }}
                      className={currentPage >= getTotalPages() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filter Modal */}
      <AdvancedFilter
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={() => {}}
        onResetFilters={() => {
          setFilters({
            searchTerm: '',
            stockStatus: 'all',
            itemType: 'all',
            location: 'all',
            minStock: '',
            maxStock: '',
            minCost: '',
            maxCost: '',
            sortBy: 'name',
            sortOrder: 'asc'
          })
        }}
        availableLocations={availableLocations}
        activeFiltersCount={getActiveFiltersCount()}
      />
    </div>
  )
}
