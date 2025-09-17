'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Users, 
  Database, 
  Shield, 
  Activity,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  HardDrive,
  Cpu,
  Wifi,
  Globe,
  Lock,
  UserCog,
  FileText,
  Calendar,
  Zap,
  Award,
  Target,
  Monitor,
  Network,
  Archive
} from 'lucide-react'

import { MetricCard } from './metric-card'
import { ChartCard } from './chart-card'
import { ActivityFeed } from './activity-feed'
import { QuickActions } from './quick-actions'

interface AdminDashboardProps {
  user: any
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    systemUptime: 99.9,
    totalDevices: 0,
    storageUsed: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkTraffic: 0,
    securityAlerts: 0,
    backupStatus: '—',
    apiCalls: 0,
    errorRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const api = await import('@/lib/api')
        const [userCounts, srStats, invStats, recentActivities] = await Promise.all([
          api.fetchAdminUserCounts(),
          api.fetchAdminServiceRequestStats(),
          api.fetchInventoryDashboardStats(),
          api.fetchInventoryRecentActivity(10)
        ])
        if (cancelled) return
        setMetrics(prev => ({
          ...prev,
          totalUsers: userCounts.totalUsers,
          activeUsers: userCounts.activeUsers,
          totalDevices: invStats?.totalDevices ?? prev.totalDevices,
          storageUsed: invStats?.storageUtilizationPercent ?? prev.storageUsed,
          memoryUsage: invStats?.memoryUsagePercent ?? prev.memoryUsage,
          cpuUsage: invStats?.cpuUsagePercent ?? prev.cpuUsage,
          networkTraffic: invStats?.networkThroughputGbps ?? prev.networkTraffic,
          errorRate: (srStats?.rejectedRequests ?? 0) / Math.max(1, srStats?.totalRequests ?? 1) * 100
        }))
        // Map recent activities to ActivityFeed format
        const mapped = (recentActivities ?? []).map((it: any, idx: number) => ({
          id: String(it.id ?? idx),
          type: 'inventory' as const,
          title: `${it.transactionType ?? 'Transaction'} - ${it.itemType ?? ''}`.trim(),
          description: `${it.quantity ?? 0} item(s) • ${it.itemName ?? it.sparePartName ?? ''}`.trim(),
          user: { name: it.performedBy ?? 'System', initials: (it.performedBy ?? 'S').slice(0, 2).toUpperCase() },
          timestamp: new Date(it.createdAt ?? Date.now()),
          status: 'completed' as const
        }))
        // @ts-ignore add activities lazily
        setActivities(mapped)
      } catch (e: any) {
        setError(e?.message || 'Failed to load admin dashboard')
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const quickActions = [
    {
      id: '1',
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: UserCog,
      href: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: '2',
      title: 'System Settings',
      description: 'Configure system preferences and settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: '3',
      title: 'Database Management',
      description: 'Monitor and manage database operations',
      icon: Database,
      href: '/admin/database',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: '4',
      title: 'Security Center',
      description: 'Monitor security alerts and access logs',
      icon: Shield,
      href: '/admin/security',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: '5',
      title: 'System Monitoring',
      description: 'Monitor system performance and health',
      icon: Monitor,
      href: '/admin/monitoring',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: '6',
      title: 'Backup & Recovery',
      description: 'Manage system backups and recovery',
      icon: Archive,
      href: '/admin/backup',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" /></div>
      ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          change={{ value: 8, type: 'increase' }}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Registered users"
          delay={0}
        />
        {/* System Uptime removed as requested */}
        <MetricCard
          title="Total Devices"
          value={metrics.totalDevices}
          change={{ value: 12, type: 'increase' }}
          icon={Database}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          description="Managed devices"
          delay={0.2}
        />
        <MetricCard
          title="Security Alerts"
          value={metrics.securityAlerts}
          icon={Shield}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          description="Active security alerts"
          badge={{ text: 'Monitor', variant: 'destructive' }}
          delay={0.3}
        />
      </motion.div>
      )}

      {/* Secondary metrics removed as requested */}

      {/* Charts and Analytics */}
      {!loading && (
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
      )}

      {/* Bottom Row */}
      {!loading && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="grid grid-cols-1 gap-6"
      >
        <ActivityFeed
          title="System Activity"
          activities={activities}
          maxItems={5}
          delay={1.3}
        />
      </motion.div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
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
      const { fetchAdminServiceRequestStats } = await import('@/lib/api')
      const stats = await fetchAdminServiceRequestStats()
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
      // Map to available fields from InventoryDashboardStats
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

