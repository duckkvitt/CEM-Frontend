'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter,
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Activity,
  Calendar,
  User,
  Package,
  Wrench
} from 'lucide-react'
import { 
  getAllInventoryTransactions,
  searchInventoryTransactions,
  InventoryTransaction,
  mockInventoryTransactions // Temporary fallback
} from '@/lib/api/inventory'
import { isAuthenticated } from '@/lib/api/client'

export default function InventoryTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    
    loadTransactions()
  }, [router])

  useEffect(() => {
    filterTransactions()
  }, [searchTerm, itemTypeFilter, transactionTypeFilter, dateFilter, transactions])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getAllInventoryTransactions()
      setTransactions(data)
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('Failed to load transactions. Using mock data for demonstration.')
      // Fallback to mock data for development
      setTransactions(mockInventoryTransactions)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

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

    // Apply transaction type filter
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.transactionType === transactionTypeFilter)
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

    setFilteredTransactions(filtered)
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Transactions</h1>
        <p className="text-muted-foreground">
          View and track all inventory movements and transactions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="IMPORT">Import</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
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
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {getTransactionTypeIcon(transaction.transactionType)}
                    {getItemTypeIcon(transaction.itemType)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{transaction.itemName}</h3>
                      {getTransactionTypeBadge(transaction.transactionType)}
                      <span className="text-sm text-muted-foreground">
                        #{transaction.transactionNumber}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
                      
                      {transaction.warehouseLocation && (
                        <div>
                          <span className="font-medium">Location:</span>
                          <span className="ml-2">{transaction.warehouseLocation}</span>
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
            </CardContent>
          </Card>
        ))}
        
        {filteredTransactions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {searchTerm || itemTypeFilter !== 'all' || transactionTypeFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'No inventory transactions recorded yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredTransactions.filter(t => t.transactionType === 'IMPORT').length}
                </p>
                <p className="text-sm text-muted-foreground">Imports</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {filteredTransactions.filter(t => t.transactionType === 'EXPORT').length}
                </p>
                <p className="text-sm text-muted-foreground">Exports</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {filteredTransactions.filter(t => !['IMPORT', 'EXPORT'].includes(t.transactionType)).length}
                </p>
                <p className="text-sm text-muted-foreground">Other</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
