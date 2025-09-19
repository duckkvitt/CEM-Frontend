'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
  Database,
  Warehouse,
  History,
  Upload,
  Download,
  Settings,
  UserCog,
  ClipboardList
} from 'lucide-react'

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
        const [cust, contracts, invStats, invRecent, srStats, pendingSr, lowStocks, unsignedContracts] = await Promise.all([
          api.fetchManagerCustomerCounts(),
          api.fetchManagerContractCounts(),
          api.fetchInventoryDashboardStats(),
          api.fetchInventoryRecentActivity(10),
          api.fetchManagerServiceRequestStats(),
          api.fetchManagerPendingServiceRequestsCount(),
          api.fetchManagerLowStockCounts(),
          api.fetchManagerUnsignedContractsCount()
        ])

        if (cancelled) return

        setMetrics(prev => ({
          ...prev,
          totalCustomers: cust.totalCustomers ?? 0,
          totalDevices: invStats?.totalDevices ?? 0,
          totalContracts: contracts.totalContracts ?? 0,
          pendingServiceRequests: pendingSr.totalPending ?? 0,
          unsignedContracts: unsignedContracts.totalUnsigned ?? 0,
          completedRequests: srStats?.completedRequests ?? 0,
          lowStockDevices: lowStocks.lowStockDevices ?? 0,
          lowStockSpareParts: lowStocks.lowStockSpareParts ?? 0
        }))

        const mapped = (invRecent ?? []).slice(0, 10).map((a: any, idx: number) => ({
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

  // Quick actions removed per request

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
          change={{ value: 12, type: 'increase' }}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Active customer accounts"
          delay={0}
        />
        <MetricCard
          title="Total Devices"
          value={metrics.totalDevices}
          change={{ value: 8, type: 'increase' }}
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
          description="Contracts under management"
          delay={0.2}
        />
        <MetricCard
          title="Pending Service Requests"
          value={metrics.pendingServiceRequests}
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Awaiting action"
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
          delay={0.5}
        />
        <MetricCard
          title="Completed Requests"
          value={metrics.completedRequests}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Resolved this month"
          delay={0.6}
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockDevices + metrics.lowStockSpareParts}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          description="Need reordering"
          badge={{ text: 'Action Required', variant: 'destructive' }}
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

      {/* Bottom Row */}
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
              maxItems={5}
              delay={1.3}
            />
          )}
        </div>
        
        {/* Quick actions removed */}
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