'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users,
  Package,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  History,
  Warehouse,
  UsersRound,
  Wrench,
  Store
} from 'lucide-react'

import Link from 'next/link'
import { MetricCard } from './metric-card'
import { ChartCard } from './chart-card'
import { ActivityFeed } from './activity-feed'

interface ManagerDashboardProps {
  user: any
}

export function ManagerDashboard({ user }: ManagerDashboardProps) {
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalDevices: 0,
    totalContracts: 0,
    pendingServiceRequests: 0,
    unsignedContracts: 0,
    completedRequests: 0,
    lowStockDevices: 0,
    lowStockSpareParts: 0
  })
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const api = await import('@/lib/api')
        const invLib = await import('@/lib/api/inventory')

        const results = await Promise.allSettled([
          api.fetchManagerCustomerCounts(),
          api.fetchManagerContractCounts(),
          api.fetchInventoryDashboardStats(),
          // Prefer dashboard recent activity; fallback later to transactions
          api.fetchInventoryRecentActivity(10),
          api.fetchManagerServiceRequestStats(),
          api.fetchManagerPendingServiceRequestsCount(),
          api.fetchManagerLowStockCounts(),
          api.fetchManagerUnsignedContractsCount()
        ])

        if (cancelled) return

        const [custRes, contractRes, invStatsRes, invRecentRes, srStatsRes, pendingSrRes, lowStocksRes, unsignedRes] = results

        setMetrics(prev => ({
          ...prev,
          totalCustomers: custRes.status === 'fulfilled' ? (custRes.value.totalCustomers ?? 0) : prev.totalCustomers,
          totalDevices: invStatsRes.status === 'fulfilled' ? (invStatsRes.value?.totalDevices ?? 0) : prev.totalDevices,
          totalContracts: contractRes.status === 'fulfilled' ? (contractRes.value.totalContracts ?? 0) : prev.totalContracts,
          pendingServiceRequests: pendingSrRes.status === 'fulfilled' ? (pendingSrRes.value.totalPending ?? 0) : prev.pendingServiceRequests,
          unsignedContracts: unsignedRes.status === 'fulfilled' ? (unsignedRes.value.totalUnsigned ?? 0) : prev.unsignedContracts,
          completedRequests: srStatsRes.status === 'fulfilled' ? (srStatsRes.value?.completedRequests ?? 0) : prev.completedRequests,
          lowStockDevices: lowStocksRes.status === 'fulfilled' ? (lowStocksRes.value.lowStockDevices ?? 0) : prev.lowStockDevices,
          lowStockSpareParts: lowStocksRes.status === 'fulfilled' ? (lowStocksRes.value.lowStockSpareParts ?? 0) : prev.lowStockSpareParts
        }))

        // Recent activity mapping with graceful fallback
        let recent: any[] | null = null
        if (invRecentRes.status === 'fulfilled') {
          recent = invRecentRes.value ?? []
        } else {
          try {
            const tx = await invLib.getAllInventoryTransactions()
            recent = (tx ?? []).slice(0, 10)
          } catch (e) {
            recent = []
          }
        }

        const mapped = (recent ?? []).slice(0, 10).map((a: any, idx: number) => ({
          id: String(a.id ?? idx),
          type: 'inventory' as const,
          title: `${a.transactionType ?? 'TRANSACTION'} - ${a.itemType ?? ''}`,
          description: a.notes ?? `Quantity: ${a.quantity ?? 0}`,
          user: { name: a.performedBy ?? 'System', initials: (a.performedBy ?? 'SYS').slice(0,2).toUpperCase() },
          timestamp: a.createdAt ? new Date(a.createdAt) : new Date(),
          status: 'completed' as const
        }))
        setActivities(mapped)
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load manager dashboard')
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Active customer accounts"
          delay={0}
        />
        <MetricCard
          title="Total Devices"
          value={metrics.totalDevices}
          icon={Package}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Managed devices"
          delay={0.1}
        />
        <MetricCard
          title="Total Contracts"
          value={metrics.totalContracts}
          icon={FileText}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Under management"
          delay={0.2}
        />
        <MetricCard
          title="Pending Service Requests"
          value={metrics.pendingServiceRequests}
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Awaiting action"
          badge={metrics.pendingServiceRequests > 0 ? { text: 'Review', variant: 'warning' } : undefined}
          delay={0.3}
        />
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Unsigned Contracts"
          value={metrics.unsignedContracts}
          icon={FileText}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Pending customer signature"
          badge={metrics.unsignedContracts > 0 ? { text: 'Sign', variant: 'warning' } : undefined}
          delay={0.5}
        />
        <MetricCard
          title="Completed Requests"
          value={metrics.completedRequests}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Resolved (all time)"
          delay={0.6}
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockDevices + metrics.lowStockSpareParts}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          description="Devices + Spare parts"
          badge={metrics.lowStockDevices + metrics.lowStockSpareParts > 0 ? { text: 'Action Required', variant: 'destructive' } : undefined}
          delay={0.7}
        />
      </motion.div>

      {/* Charts and Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <ChartCard
          title="Service Requests"
          icon={BarChart3}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={1.0}
        >
          <div className="h-56 md:h-60"><RequestsBarChart /></div>
        </ChartCard>

        <ChartCard
          title="Inventory Overview"
          icon={TrendingUp}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          delay={1.1}
        >
          <div className="h-64 md:h-72"><InventoryDonut /></div>
        </ChartCard>
      </motion.div>

      {/* Recent Activity & Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          {!loading && (
            <ActivityFeed
              title="Recent Inventory Activity"
              activities={activities}
              maxItems={6}
              delay={1.3}
            />
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/support/service-requests" className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent transition-colors">
              <History className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Service Requests</span>
            </Link>
            <Link href="/inventory" className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent transition-colors">
              <Warehouse className="h-4 w-4 text-green-600" />
              <span className="text-sm">Inventory</span>
            </Link>
            <Link href="/contracts" className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent transition-colors">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">Contracts</span>
            </Link>
            <Link href="/customers" className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent transition-colors">
              <UsersRound className="h-4 w-4 text-indigo-600" />
              <span className="text-sm">Customers</span>
            </Link>
            <Link href="/spare-parts" className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent transition-colors">
              <Wrench className="h-4 w-4 text-amber-600" />
              <span className="text-sm">Spare Parts</span>
            </Link>
            <Link href="/suppliers" className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent transition-colors">
              <Store className="h-4 w-4 text-pink-600" />
              <span className="text-sm">Suppliers</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Lightweight chart components backed by react-chartjs-2
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

function RequestsBarChart() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { fetchManagerServiceRequestStats } = await import('@/lib/api')
      const stats = await fetchManagerServiceRequestStats()
      if (cancelled) return
      const labels = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected']
      const values = [
        stats?.pendingRequests ?? 0,
        stats?.approvedRequests ?? 0,
        stats?.inProgressRequests ?? 0,
        stats?.completedRequests ?? 0,
        stats?.rejectedRequests ?? 0
      ]
      setData({
        labels,
        datasets: [{ label: 'Requests', data: values, backgroundColor: '#3b82f6' }]
      })
    })()
    return () => { cancelled = true }
  }, [])
  if (!data) return <div className="h-64 flex items-center justify-center">Loading chart…</div>
  return <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
}

function InventoryDonut() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { fetchInventoryDashboardStats } = await import('@/lib/api')
      const stats = await fetchInventoryDashboardStats()
      if (cancelled) return
      const labels = ['Total Devices', 'Total Spare Parts', 'Low Stock Devices', 'Low Stock Spare Parts', 'Out of Stock Devices']
      const values = [
        stats?.totalDevices ?? 0,
        stats?.totalSpareParts ?? 0,
        stats?.lowStockDevices ?? 0,
        stats?.lowStockSpareParts ?? 0,
        stats?.outOfStockDevices ?? 0
      ]
      setData({
        labels,
        datasets: [{
          label: 'Inventory',
          data: values,
          backgroundColor: ['#22c55e', '#a78bfa', '#f59e0b', '#60a5fa', '#ef4444']
        }]
      })
    })()
    return () => { cancelled = true }
  }, [])
  if (!data) return <div className="h-64 flex items-center justify-center">Loading chart…</div>
  return (
    <Doughnut 
      data={data} 
      options={{ 
        responsive: true,
        maintainAspectRatio: false,
        cutout: '50%',
        plugins: { 
          legend: { 
            position: 'right',
            align: 'center',
            labels: { usePointStyle: true, pointStyle: 'rectRounded' }
          } 
        },
        layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } }
      }} 
    />
  )
}