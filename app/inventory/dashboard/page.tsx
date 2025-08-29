'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Wrench, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  Users
} from 'lucide-react'
import { 
  getInventoryDashboardStats,
  getRecentInventoryActivity,
  InventoryStats
} from '@/lib/api/inventory'
import { isAuthenticated } from '@/lib/api/client'



export default function WarehouseDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<InventoryStats | null>(null)

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest inventory movements and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getActivityIcon(activity.transactionType)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{activity.itemName}</p>
                      {getActivityBadge(activity.transactionType)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.quantity > 0 ? '+' : ''}{activity.quantity} units • {activity.createdBy} • {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Device Statistics
            </CardTitle>
            <CardDescription>
              Overview of device inventory status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats?.totalDevices - (stats?.lowStockDevices || 0) - (stats?.outOfStockDevices || 0)}</p>
                <p className="text-sm text-green-700">Healthy Stock</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats?.lowStockDevices || 0}</p>
                <p className="text-sm text-yellow-700">Low Stock</p>
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats?.outOfStockDevices || 0}</p>
              <p className="text-sm text-red-700">Out of Stock</p>
            </div>
          </CardContent>
        </Card>

        {/* Spare Part Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Spare Part Statistics
            </CardTitle>
            <CardDescription>
              Overview of spare part inventory status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats?.totalSpareParts - (stats?.lowStockSpareParts || 0) - (stats?.outOfStockSpareParts || 0)}</p>
                <p className="text-sm text-green-700">Healthy Stock</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats?.lowStockSpareParts || 0}</p>
                <p className="text-sm text-yellow-700">Low Stock</p>
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats?.outOfStockSpareParts || 0}</p>
              <p className="text-sm text-red-700">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alerts & Recommendations
          </CardTitle>
          <CardDescription>
            Important notifications and suggested actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats?.outOfStockDevices || 0) > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    {(stats?.outOfStockDevices || 0)} device(s) are out of stock
                  </p>
                  <p className="text-sm text-red-600">
                    Immediate reorder required to prevent service disruptions
                  </p>
                </div>
              </div>
            )}

            {(stats?.lowStockDevices || 0) > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {(stats?.lowStockDevices || 0)} device(s) have low stock levels
                  </p>
                  <p className="text-sm text-yellow-600">
                    Consider reordering to maintain adequate inventory
                  </p>
                </div>
              </div>
            )}

            {(stats?.outOfStockSpareParts || 0) > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    {(stats?.outOfStockSpareParts || 0)} spare part(s) are out of stock
                  </p>
                  <p className="text-sm text-red-600">
                    Reorder needed to support maintenance activities
                  </p>
                </div>
              </div>
            )}

            {(stats?.lowStockSpareParts || 0) > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {(stats?.lowStockSpareParts || 0)} spare part(s) have low stock levels
                  </p>
                  <p className="text-sm text-yellow-600">
                    Monitor usage and plan reorders accordingly
                  </p>
                </div>
              </div>
            )}

            {(stats?.outOfStockDevices || 0) === 0 && (stats?.lowStockDevices || 0) === 0 && 
             (stats?.outOfStockSpareParts || 0) === 0 && (stats?.lowStockSpareParts || 0) === 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    All inventory levels are healthy
                  </p>
                  <p className="text-sm text-green-600">
                    Continue monitoring and maintain current stock levels
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
