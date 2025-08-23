'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  History, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Package, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Database,
  Wrench,
  RefreshCw
} from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { getAccessToken } from '@/lib/auth'
import { DEVICE_SERVICE_URL, SPARE_PARTS_SERVICE_URL } from '@/lib/api'

interface Transaction {
  id: number
  transactionNumber: string
  transactionType: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT' | 'TRANSFER'
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  referenceType?: string
  referenceId?: number
  transactionReason?: string
  createdBy: string
  createdAt: string
  type: 'device' | 'spare-part'
  device?: {
    id: number
    name: string
    model: string
  }
  sparePart?: {
    id: number
    partName: string
    partCode: string
  }
}

export default function InventoryTransactions() {
  const [deviceTransactions, setDeviceTransactions] = useState<Transaction[]>([])
  const [sparePartTransactions, setSparePartTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      
      if (!token) {
        setError('Please login to access transaction history')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load device transactions
      try {
        const deviceParams = new URLSearchParams({
          page: '0',
          size: '50',
          ...(searchTerm && { keyword: searchTerm }),
          ...(typeFilter !== 'all' && { transactionType: typeFilter })
        })
        
        const deviceResponse = await fetch(`${DEVICE_SERVICE_URL}/warehouse/transactions/search?${deviceParams}`, { headers })
        if (deviceResponse.ok) {
          const deviceData = await deviceResponse.json()
          console.log('Device transactions response:', deviceData)
          const deviceTransactionsWithType: Transaction[] = (deviceData.content || []).map((txn: any) => ({
            ...txn,
            type: 'device' as const
          }))
          setDeviceTransactions(deviceTransactionsWithType)
          console.log('Processed device transactions:', deviceTransactionsWithType)
        } else {
          console.error('Device transactions response not ok:', deviceResponse.status, deviceResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load device transactions:', err)
      }

      // Load spare part transactions
      try {
        const sparePartParams = new URLSearchParams({
          page: '0',
          size: '50',
          ...(searchTerm && { keyword: searchTerm }),
          ...(typeFilter !== 'all' && { transactionType: typeFilter })
        })
        
        const sparePartResponse = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/transactions/search?${sparePartParams}`, { headers })
        if (sparePartResponse.ok) {
          const sparePartData = await sparePartResponse.json()
          console.log('Spare parts transactions response:', sparePartData)
          const sparePartTransactionsWithType: Transaction[] = (sparePartData.content || []).map((txn: any) => ({
            ...txn,
            type: 'spare-part' as const
          }))
          setSparePartTransactions(sparePartTransactionsWithType)
          console.log('Processed spare parts transactions:', sparePartTransactionsWithType)
        } else {
          console.error('Spare parts transactions response not ok:', sparePartResponse.status, sparePartResponse.statusText)
        }
      } catch (err) {
        console.error('Failed to load spare part transactions:', err)
      }

    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadTransactions()
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'EXPORT':
        return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'ADJUSTMENT':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case 'TRANSFER':
        return <Package className="h-4 w-4 text-purple-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return <Badge className="bg-green-100 text-green-800">Import</Badge>
      case 'EXPORT':
        return <Badge className="bg-red-100 text-red-800">Export</Badge>
      case 'ADJUSTMENT':
        return <Badge className="bg-blue-100 text-blue-800">Adjustment</Badge>
      case 'TRANSFER':
        return <Badge className="bg-purple-100 text-purple-800">Transfer</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getQuantityDisplay = (transaction: Transaction) => {
    const isPositive = transaction.quantityChange > 0
    const prefix = isPositive ? '+' : ''
    const color = isPositive ? 'text-green-600' : 'text-red-600'
    
    return (
      <span className={`font-medium ${color}`}>
        {prefix}{transaction.quantityChange}
      </span>
    )
  }

  const renderTransactionCard = (transaction: Transaction) => (
    <Card key={transaction.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {transaction.type === 'device' ? (
                <Database className="h-6 w-6 text-blue-500" />
              ) : (
                <Wrench className="h-6 w-6 text-green-500" />
              )}
              {getTransactionIcon(transaction.transactionType)}
            </div>
            
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {transaction.type === 'device' ? transaction.device?.name : transaction.sparePart?.partName}
                {getTransactionBadge(transaction.transactionType)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Transaction #{transaction.transactionNumber}
                {transaction.type === 'device' 
                  ? ` • Model: ${transaction.device?.model}` 
                  : ` • Code: ${transaction.sparePart?.partCode}`
                }
              </p>
              <p className="text-sm text-muted-foreground">
                By {transaction.createdBy} on {new Date(transaction.createdAt).toLocaleString()}
              </p>
              {transaction.transactionReason && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reason: {transaction.transactionReason}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Quantity Change</div>
                <div className="text-lg font-bold">
                  {getQuantityDisplay(transaction)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Before → After</div>
                <div className="text-sm font-medium">
                  {transaction.quantityBefore} → {transaction.quantityAfter}
                </div>
              </div>
            </div>
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
              <p className="text-muted-foreground">Loading transaction history...</p>
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

  // Combine and sort all transactions by date
  const allTransactions = [...deviceTransactions, ...sparePartTransactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Transactions</h1>
            <p className="text-muted-foreground">
              Complete history of all inventory changes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadTransactions}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <History className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{allTransactions.length}</p>
                </div>
                <History className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Imports</p>
                  <p className="text-2xl font-bold text-green-600">
                    {allTransactions.filter(t => t.transactionType === 'IMPORT').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Exports</p>
                  <p className="text-2xl font-bold text-red-600">
                    {allTransactions.filter(t => t.transactionType === 'EXPORT').length}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adjustments</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {allTransactions.filter(t => t.transactionType === 'ADJUSTMENT').length}
                  </p>
                </div>
                <RotateCcw className="h-8 w-8 text-blue-500" />
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
                  placeholder="Search by transaction number, item name, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="IMPORT">Import</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              All Transactions ({allTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Devices ({deviceTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="spare-parts" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Spare Parts ({sparePartTransactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Inventory Transactions</CardTitle>
                <CardDescription>
                  Complete transaction history for all inventory items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  allTransactions.map(renderTransactionCard)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>Device Transactions</CardTitle>
                <CardDescription>
                  Transaction history for device inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deviceTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No device transactions found
                  </div>
                ) : (
                  deviceTransactions.map(renderTransactionCard)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spare-parts">
            <Card>
              <CardHeader>
                <CardTitle>Spare Parts Transactions</CardTitle>
                <CardDescription>
                  Transaction history for spare parts inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sparePartTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No spare parts transactions found
                  </div>
                ) : (
                  sparePartTransactions.map(renderTransactionCard)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
