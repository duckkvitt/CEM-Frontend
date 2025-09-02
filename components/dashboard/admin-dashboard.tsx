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
    totalUsers: 1247,
    activeUsers: 892,
    systemUptime: 99.9,
    totalDevices: 3421,
    storageUsed: 78.5,
    memoryUsage: 65.2,
    cpuUsage: 45.8,
    networkTraffic: 2.3,
    securityAlerts: 3,
    backupStatus: 'Success',
    apiCalls: 156789,
    errorRate: 0.02
  })

  const [activities] = useState([
    {
      id: '1',
      type: 'system' as const,
      title: 'System backup completed',
      description: 'Daily backup completed successfully',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'completed' as const
    },
    {
      id: '2',
      type: 'system' as const,
      title: 'Security scan completed',
      description: 'Weekly security scan found 0 vulnerabilities',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'completed' as const
    },
    {
      id: '3',
      type: 'system' as const,
      title: 'New user registered',
      description: 'New user account created for John Smith',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'completed' as const
    },
    {
      id: '4',
      type: 'system' as const,
      title: 'Database optimization',
      description: 'Database performance optimization completed',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      status: 'completed' as const
    },
    {
      id: '5',
      type: 'system' as const,
      title: 'Security alert triggered',
      description: 'Unusual login pattern detected from IP 192.168.1.100',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      status: 'pending' as const,
      priority: 'high' as const
    }
  ])

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
        <MetricCard
          title="System Uptime"
          value={`${metrics.systemUptime}%`}
          change={{ value: 0.1, type: 'increase' }}
          icon={Server}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="System availability"
          badge={{ text: 'Excellent', variant: 'default' }}
          delay={0.1}
        />
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

      {/* Secondary Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Storage Used"
          value={`${metrics.storageUsed}%`}
          change={{ value: 5, type: 'increase' }}
          icon={HardDrive}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Disk space utilization"
          delay={0.5}
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.memoryUsage}%`}
          change={{ value: 3, type: 'decrease' }}
          icon={Cpu}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          description="RAM utilization"
          delay={0.6}
        />
        <MetricCard
          title="CPU Usage"
          value={`${metrics.cpuUsage}%`}
          change={{ value: 8, type: 'decrease' }}
          icon={Activity}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Processor utilization"
          delay={0.7}
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate}%`}
          change={{ value: 50, type: 'decrease' }}
          icon={AlertTriangle}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="System error rate"
          badge={{ text: 'Low', variant: 'default' }}
          delay={0.8}
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
          title="System Performance"
          icon={BarChart3}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={1.0}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600">System performance metrics</p>
              <p className="text-sm text-gray-500 mt-1">99.9% uptime, 0.02% error rate</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Resource Utilization"
          icon={TrendingUp}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          delay={1.1}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-600">Resource utilization trends</p>
              <p className="text-sm text-gray-500 mt-1">CPU: 45.8%, Memory: 65.2%</p>
            </div>
          </div>
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
          <ActivityFeed
            title="System Activity"
            activities={activities}
            maxItems={5}
            delay={1.3}
          />
        </div>
        
        <QuickActions
          title="Admin Actions"
          actions={quickActions}
          delay={1.4}
        />
      </motion.div>
    </div>
  )
}

