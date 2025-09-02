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
import { QuickActions } from './quick-actions'

interface ManagerDashboardProps {
  user: any
}

export function ManagerDashboard({ user }: ManagerDashboardProps) {
  const [metrics, setMetrics] = useState({
    totalCustomers: 1247,
    totalDevices: 3421,
    totalRevenue: 2450000,
    activeTasks: 89,
    pendingRequests: 23,
    completedTasks: 156,
    lowStockItems: 12,
    systemHealth: 98.5
  })

  const [activities] = useState([
    {
      id: '1',
      type: 'task' as const,
      title: 'New customer onboarding completed',
      description: 'Successfully onboarded 5 new enterprise customers',
      user: { name: 'John Smith', initials: 'JS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'completed' as const
    },
    {
      id: '2',
      type: 'device' as const,
      title: 'Device maintenance scheduled',
      description: 'Scheduled maintenance for 15 network devices',
      user: { name: 'Sarah Johnson', initials: 'SJ' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'in-progress' as const
    },
    {
      id: '3',
      type: 'customer' as const,
      title: 'Customer support ticket resolved',
      description: 'Resolved critical issue for TechCorp Inc.',
      user: { name: 'Mike Davis', initials: 'MD' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'completed' as const
    },
    {
      id: '4',
      type: 'inventory' as const,
      title: 'Low stock alert triggered',
      description: 'Network switches running low on stock',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      status: 'pending' as const,
      priority: 'high' as const
    },
    {
      id: '5',
      type: 'system' as const,
      title: 'Monthly report generated',
      description: 'Q4 performance report is ready for review',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      status: 'completed' as const
    }
  ])

  const quickActions = [
    {
      id: '1',
      title: 'View Reports',
      description: 'Access detailed analytics and reports',
      icon: BarChart3,
      href: '/reports',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: '2',
      title: 'Manage Customers',
      description: 'View and manage customer accounts',
      icon: Users,
      href: '/customers',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: '3',
      title: 'Inventory Overview',
      description: 'Monitor stock levels and inventory',
      icon: Warehouse,
      href: '/inventory',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: '4',
      title: 'Task Management',
      description: 'Assign and track team tasks',
      icon: ClipboardList,
      href: '/tasks',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: '5',
      title: 'Contract Management',
      description: 'Review and manage contracts',
      icon: FileText,
      href: '/contracts',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: '6',
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      href: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
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
          title="Monthly Revenue"
          value={`$${(metrics.totalRevenue / 1000000).toFixed(1)}M`}
          change={{ value: 15, type: 'increase' }}
          icon={DollarSign}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="This month's revenue"
          delay={0.2}
        />
        <MetricCard
          title="Active Tasks"
          value={metrics.activeTasks}
          change={{ value: 5, type: 'decrease' }}
          icon={Activity}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Tasks in progress"
          badge={{ text: 'High Priority', variant: 'destructive' }}
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
          title="Pending Requests"
          value={metrics.pendingRequests}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Awaiting approval"
          delay={0.5}
        />
        <MetricCard
          title="Completed Tasks"
          value={metrics.completedTasks}
          change={{ value: 22, type: 'increase' }}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="This month"
          delay={0.6}
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockItems}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          description="Need reordering"
          badge={{ text: 'Action Required', variant: 'destructive' }}
          delay={0.7}
        />
        <MetricCard
          title="System Health"
          value={`${metrics.systemHealth}%`}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Overall system status"
          badge={{ text: 'Excellent', variant: 'default' }}
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
          title="Revenue Trend"
          icon={BarChart3}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          delay={1.0}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-600">Revenue analytics chart</p>
              <p className="text-sm text-gray-500 mt-1">+15% growth this month</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Task Distribution"
          icon={ClipboardList}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={1.1}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600">Task distribution chart</p>
              <p className="text-sm text-gray-500 mt-1">89 active, 156 completed</p>
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
            title="Recent Activity"
            activities={activities}
            maxItems={5}
            delay={1.3}
          />
        </div>
        
        <QuickActions
          title="Quick Actions"
          actions={quickActions}
          delay={1.4}
        />
      </motion.div>
    </div>
  )
}

