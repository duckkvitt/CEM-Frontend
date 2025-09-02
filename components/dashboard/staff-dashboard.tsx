'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ClipboardList, 
  Package, 
  Users, 
  FileText, 
  Upload, 
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Database,
  Warehouse,
  History,
  Settings,
  BarChart3,
  Calendar,
  Activity
} from 'lucide-react'

import { MetricCard } from './metric-card'
import { ChartCard } from './chart-card'
import { ActivityFeed } from './activity-feed'
import { QuickActions } from './quick-actions'

interface StaffDashboardProps {
  user: any
}

export function StaffDashboard({ user }: StaffDashboardProps) {
  const [metrics, setMetrics] = useState({
    assignedTasks: 12,
    completedToday: 8,
    pendingApprovals: 5,
    inventoryUpdates: 23,
    customerInteractions: 15,
    documentsProcessed: 34,
    systemAlerts: 2,
    productivityScore: 87
  })

  const [activities] = useState([
    {
      id: '1',
      type: 'task' as const,
      title: 'Inventory update completed',
      description: 'Updated stock levels for 15 network devices',
      user: { name: 'Alex Johnson', initials: 'AJ' },
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      status: 'completed' as const
    },
    {
      id: '2',
      type: 'customer' as const,
      title: 'Customer data updated',
      description: 'Updated contact information for TechCorp Inc.',
      user: { name: 'Maria Garcia', initials: 'MG' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      status: 'completed' as const
    },
    {
      id: '3',
      type: 'device' as const,
      title: 'Device registration processed',
      description: 'Registered 8 new devices in the system',
      user: { name: 'David Lee', initials: 'DL' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'in-progress' as const
    },
    {
      id: '4',
      type: 'inventory' as const,
      title: 'Low stock alert processed',
      description: 'Processed reorder request for network cables',
      user: { name: 'Sarah Wilson', initials: 'SW' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      status: 'completed' as const
    },
    {
      id: '5',
      type: 'system' as const,
      title: 'Document approval required',
      description: 'Contract renewal document needs approval',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'pending' as const,
      priority: 'medium' as const
    }
  ])

  const quickActions = [
    {
      id: '1',
      title: 'Customer Management',
      description: 'Manage customer accounts and data',
      icon: Users,
      href: '/customers',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: '2',
      title: 'Device Management',
      description: 'Register and manage devices',
      icon: Package,
      href: '/devices',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: '3',
      title: 'Inventory Overview',
      description: 'Monitor and update inventory',
      icon: Warehouse,
      href: '/inventory',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: '4',
      title: 'Import Inventory',
      description: 'Import new inventory items',
      icon: Upload,
      href: '/inventory/import',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: '5',
      title: 'Contract Management',
      description: 'Process and manage contracts',
      icon: FileText,
      href: '/contracts',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: '6',
      title: 'Spare Parts',
      description: 'Manage spare parts inventory',
      icon: Database,
      href: '/spare-parts',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
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
          title="Assigned Tasks"
          value={metrics.assignedTasks}
          change={{ value: 3, type: 'increase' }}
          icon={ClipboardList}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Tasks assigned to you"
          delay={0}
        />
        <MetricCard
          title="Completed Today"
          value={metrics.completedToday}
          change={{ value: 20, type: 'increase' }}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Tasks completed today"
          delay={0.1}
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Awaiting your approval"
          badge={{ text: 'Action Required', variant: 'destructive' }}
          delay={0.2}
        />
        <MetricCard
          title="Productivity Score"
          value={`${metrics.productivityScore}%`}
          change={{ value: 5, type: 'increase' }}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="This week's performance"
          badge={{ text: 'Excellent', variant: 'default' }}
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
          title="Inventory Updates"
          value={metrics.inventoryUpdates}
          change={{ value: 12, type: 'increase' }}
          icon={Database}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Items updated today"
          delay={0.5}
        />
        <MetricCard
          title="Customer Interactions"
          value={metrics.customerInteractions}
          change={{ value: 8, type: 'increase' }}
          icon={Users}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          description="Customer touchpoints"
          delay={0.6}
        />
        <MetricCard
          title="Documents Processed"
          value={metrics.documentsProcessed}
          change={{ value: 15, type: 'increase' }}
          icon={FileText}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          description="Documents handled"
          delay={0.7}
        />
        <MetricCard
          title="System Alerts"
          value={metrics.systemAlerts}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          description="Require attention"
          badge={{ text: 'Review', variant: 'destructive' }}
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
          title="Task Completion Trend"
          icon={BarChart3}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={1.0}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-600">Task completion analytics</p>
              <p className="text-sm text-gray-500 mt-1">87% completion rate this week</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Daily Activity"
          icon={Activity}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          delay={1.1}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600">Daily activity overview</p>
              <p className="text-sm text-gray-500 mt-1">8 tasks completed today</p>
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

