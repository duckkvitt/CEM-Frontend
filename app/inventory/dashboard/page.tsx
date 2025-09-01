'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Wrench, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  Users,
  Search,
  Filter,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import { 
  getInventoryDashboardStats,
  getRecentInventoryActivity,
  getAllInventoryTransactions,
  InventoryStats,
  InventoryTransaction
} from '@/lib/api/inventory'
import { isAuthenticated } from '@/lib/api/client'



export default function WarehouseDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [allTransactions, setAllTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [itemTypeFilter, setItemTypeFilter] = useState('all')

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load dashboard statistics
      const dashboardStats = await getInventoryDashboardStats()
      setStats(dashboardStats)
      
      // Load recent activity
      const recentActivityData = await getRecentInventoryActivity(10)
      setRecentActivity(recentActivityData)
      
      // Load all transactions for import/export tabs
      const transactionsData = await getAllInventoryTransactions()
      setAllTransactions(transactionsData)
      
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data. Using mock data for demonstration.')
      
      // Fallback to mock data for development
      setStats({
        totalDevices: 25,
        totalSpareParts: 150,
        lowStockDevices: 3,
        lowStockSpareParts: 7,
        outOfStockDevices: 2,
        outOfStockSpareParts: 5
      })
      setRecentActivity([])
      setAllTransactions([])
    } finally {
      setLoading(false)
    }
  }



  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'EXPORT':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'ADJUSTMENT':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return <Badge variant="default" className="bg-green-100 text-green-800">Import</Badge>
      case 'EXPORT':
        return <Badge variant="destructive">Export</Badge>
      case 'ADJUSTMENT':
        return <Badge variant="secondary">Adjustment</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter transactions by type and search criteria
  const getFilteredTransactions = (transactionType: 'IMPORT' | 'EXPORT') => {
    let filtered = allTransactions.filter(t => t.transactionType === transactionType)

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply item type filter
    if (itemTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.itemType === itemTypeFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const transactionDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(transaction => {
            transactionDate.setTime(Date.parse(transaction.createdAt))
            return transactionDate.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(transaction => {
            transactionDate.setTime(Date.parse(transaction.createdAt))
            return transactionDate >= weekAgo
          })
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(transaction => {
            transactionDate.setTime(Date.parse(transaction.createdAt))
            return transactionDate >= monthAgo
          })
          break
      }
    }

    return filtered
  }

  // Get paginated transactions
  const getPaginatedTransactions = (transactions: InventoryTransaction[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return transactions.slice(startIndex, endIndex)
  }

  // Get total pages for pagination
  const getTotalPages = (transactions: InventoryTransaction[]) => {
    return Math.ceil(transactions.length / itemsPerPage)
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFilter, itemTypeFilter])

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return <Badge variant="default" className="bg-green-100 text-green-800">Import</Badge>
      case 'EXPORT':
        return <Badge variant="destructive">Export</Badge>
      case 'ADJUSTMENT':
        return <Badge variant="secondary">Adjustment</Badge>
      case 'TRANSFER':
        return <Badge variant="outline">Transfer</Badge>
      case 'RETURN':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Return</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'DEVICE':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'SPARE_PART':
        return <Wrench className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return 'N/A'
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
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of inventory status, trends, and key metrics
        </p>
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDevices + stats?.totalSpareParts}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalDevices} devices + {stats?.totalSpareParts} spare parts
            </p>
          </CardContent>
        </Card>



        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowStockDevices + stats?.lowStockSpareParts}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.lowStockDevices} devices + {stats?.lowStockSpareParts} spare parts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.outOfStockDevices + stats?.outOfStockSpareParts}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.outOfStockDevices} devices + {stats?.outOfStockSpareParts} spare parts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Import/Export Transactions */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Import & Export Transactions
            </CardTitle>
            <CardDescription>
              Track and manage inventory movements with advanced filtering
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Item Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Item Types</SelectItem>
                  <SelectItem value="DEVICE">Devices</SelectItem>
                  <SelectItem value="SPARE_PART">Spare Parts</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabs for Import/Export */}
            <Tabs defaultValue="import" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Import ({getFilteredTransactions('IMPORT').length})
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Export ({getFilteredTransactions('EXPORT').length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="import" className="mt-6">
                <ImportExportTab 
                  transactions={getFilteredTransactions('IMPORT')}
                  transactionType="IMPORT"
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                />
              </TabsContent>
              
              <TabsContent value="export" className="mt-6">
                <ImportExportTab 
                  transactions={getFilteredTransactions('EXPORT')}
                  transactionType="EXPORT"
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Compact Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Statistics - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Device Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{stats?.totalDevices - (stats?.lowStockDevices || 0) - (stats?.outOfStockDevices || 0)}</p>
                <p className="text-xs text-green-700">Healthy</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-lg font-bold text-yellow-600">{stats?.lowStockDevices || 0}</p>
                <p className="text-xs text-yellow-700">Low Stock</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">{stats?.outOfStockDevices || 0}</p>
                <p className="text-xs text-red-700">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spare Part Statistics - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4" />
              Spare Part Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{stats?.totalSpareParts - (stats?.lowStockSpareParts || 0) - (stats?.outOfStockSpareParts || 0)}</p>
                <p className="text-xs text-green-700">Healthy</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-lg font-bold text-yellow-600">{stats?.lowStockSpareParts || 0}</p>
                <p className="text-xs text-yellow-700">Low Stock</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">{stats?.outOfStockSpareParts || 0}</p>
                <p className="text-xs text-red-700">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Quick Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(stats?.outOfStockDevices || 0) > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-red-800 text-sm">
                    {(stats?.outOfStockDevices || 0)} devices out of stock
                  </p>
                </div>
              </div>
            )}

            {(stats?.lowStockDevices || 0) > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-yellow-800 text-sm">
                    {(stats?.lowStockDevices || 0)} devices low stock
                  </p>
                </div>
              </div>
            )}

            {(stats?.outOfStockSpareParts || 0) > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-red-800 text-sm">
                    {(stats?.outOfStockSpareParts || 0)} spare parts out of stock
                  </p>
                </div>
              </div>
            )}

            {(stats?.lowStockSpareParts || 0) > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-yellow-800 text-sm">
                    {(stats?.lowStockSpareParts || 0)} spare parts low stock
                  </p>
                </div>
              </div>
            )}

            {(stats?.outOfStockDevices || 0) === 0 && (stats?.lowStockDevices || 0) === 0 && 
             (stats?.outOfStockSpareParts || 0) === 0 && (stats?.lowStockSpareParts || 0) === 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg col-span-full">
                <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-green-800 text-sm">
                    All inventory levels are healthy
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ImportExportTab Component
interface ImportExportTabProps {
  transactions: InventoryTransaction[]
  transactionType: 'IMPORT' | 'EXPORT'
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
}

function ImportExportTab({ 
  transactions, 
  transactionType, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage 
}: ImportExportTabProps) {
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  const totalPages = Math.ceil(transactions.length / itemsPerPage)
  
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'EXPORT':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'ADJUSTMENT':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'DEVICE':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'SPARE_PART':
        return <Wrench className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return <Badge variant="default" className="bg-green-100 text-green-800">Import</Badge>
      case 'EXPORT':
        return <Badge variant="destructive">Export</Badge>
      case 'ADJUSTMENT':
        return <Badge variant="secondary">Adjustment</Badge>
      case 'TRANSFER':
        return <Badge variant="outline">Transfer</Badge>
      case 'RETURN':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Return</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No {transactionType.toLowerCase()} transactions found</h3>
        <p className="text-gray-500">
          {transactionType === 'IMPORT' 
            ? 'No import transactions recorded yet.' 
            : 'No export transactions recorded yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Transactions List */}
      <div className="space-y-3">
        {paginatedTransactions.map((transaction) => (
          <div key={transaction.id} className="flex items-start justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex items-center gap-2">
                {getTransactionTypeIcon(transaction.transactionType)}
                {getItemTypeIcon(transaction.itemType)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-base">{transaction.itemName}</h3>
                  {getTransactionTypeBadge(transaction.transactionType)}
                  <span className="text-sm text-muted-foreground">
                    #{transaction.transactionNumber}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Quantity:</span>
                    <span className={`ml-2 ${transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} units
                    </span>
                  </div>
                  
                  {transaction.unitPrice && (
                    <div>
                      <span className="font-medium">Unit Price:</span>
                      <span className="ml-2">{formatCurrency(transaction.unitPrice)}</span>
                    </div>
                  )}
                  
                  {transaction.totalAmount && (
                    <div>
                      <span className="font-medium">Total Amount:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(transaction.totalAmount)}</span>
                    </div>
                  )}
                </div>
                
                {transaction.referenceNumber && (
                  <div className="text-sm">
                    <span className="font-medium">Reference:</span>
                    <span className="ml-2">{transaction.referenceNumber}</span>
                    {transaction.referenceType && (
                      <span className="ml-2 text-muted-foreground">
                        ({transaction.referenceType})
                      </span>
                    )}
                  </div>
                )}
                
                {transaction.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Notes:</span>
                    <span className="ml-2 text-muted-foreground">{transaction.notes}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{transaction.createdBy}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
