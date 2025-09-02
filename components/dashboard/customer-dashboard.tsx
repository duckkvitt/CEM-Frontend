'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Activity,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  FileText,
  Bot,
  Headphones,
  Zap,
  Star,
  Package,
  Database,
  Settings,
  BarChart3,
  Award,
  Shield,
  CreditCard,
  Download,
  History
} from 'lucide-react'

import { MetricCard } from './metric-card'
import { ChartCard } from './chart-card'
import { ActivityFeed } from './activity-feed'
import { QuickActions } from './quick-actions'

interface CustomerDashboardProps {
  user: any
}

export function CustomerDashboard({ user }: CustomerDashboardProps) {
  const [metrics, setMetrics] = useState({
    activeServices: 3,
    pendingRequests: 2,
    completedServices: 15,
    avgResponseTime: 1.5,
    serviceRating: 4.8,
    upcomingMaintenance: 1,
    totalDevices: 12,
    contractStatus: 'Active'
  })

  const [activities] = useState([
    {
      id: '1',
      type: 'task' as const,
      title: 'Service request submitted',
      description: 'Network connectivity issue reported and ticket created',
      user: { name: 'John Smith', initials: 'JS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'pending' as const
    },
    {
      id: '2',
      type: 'device' as const,
      title: 'Device maintenance completed',
      description: 'Routine maintenance completed on server equipment',
      user: { name: 'Sarah Johnson', initials: 'SJ' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'completed' as const
    },
    {
      id: '3',
      type: 'customer' as const,
      title: 'Support ticket resolved',
      description: 'Email connectivity issue resolved successfully',
      user: { name: 'Mike Davis', initials: 'MD' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'completed' as const
    },
    {
      id: '4',
      type: 'system' as const,
      title: 'Monthly report available',
      description: 'Service performance report is ready for download',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      status: 'completed' as const
    },
    {
      id: '5',
      type: 'task' as const,
      title: 'Maintenance scheduled',
      description: 'Scheduled maintenance for next week confirmed',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      status: 'in-progress' as const
    }
  ])

  const quickActions = [
    {
      id: '1',
      title: 'Submit Service Request',
      description: 'Report issues or request new services',
      icon: MessageSquare,
      href: '/customer/service-request',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: '2',
      title: 'View My Devices',
      description: 'Check status of your managed devices',
      icon: Package,
      href: '/customer/devices',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: '3',
      title: 'Service History',
      description: 'View past service requests and history',
      icon: History,
      href: '/customer/history',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: '4',
      title: 'Contact Support',
      description: 'Get in touch with our support team',
      icon: Headphones,
      href: '/customer/support',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: '5',
      title: 'Download Reports',
      description: 'Access service reports and documentation',
      icon: Download,
      href: '/customer/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: '6',
      title: 'Account Settings',
      description: 'Manage your account preferences',
      icon: Settings,
      href: '/customer/settings',
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
          title="Active Services"
          value={metrics.activeServices}
          change={{ value: 1, type: 'increase' }}
          icon={Activity}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Currently active services"
          delay={0}
        />
        <MetricCard
          title="Pending Requests"
          value={metrics.pendingRequests}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Awaiting response"
          badge={{ text: 'In Progress', variant: 'destructive' }}
          delay={0.1}
        />
        <MetricCard
          title="Completed Services"
          value={metrics.completedServices}
          change={{ value: 20, type: 'increase' }}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Services completed this month"
          delay={0.2}
        />
        <MetricCard
          title="Service Rating"
          value={`${metrics.serviceRating}/5`}
          change={{ value: 5, type: 'increase' }}
          icon={Star}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Average service rating"
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
          title="Avg Response Time"
          value={`${metrics.avgResponseTime}h`}
          change={{ value: 25, type: 'decrease' }}
          icon={Zap}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          description="Average response time"
          delay={0.5}
        />
        <MetricCard
          title="Upcoming Maintenance"
          value={metrics.upcomingMaintenance}
          icon={Calendar}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          description="Scheduled maintenance"
          delay={0.6}
        />
        <MetricCard
          title="Total Devices"
          value={metrics.totalDevices}
          change={{ value: 2, type: 'increase' }}
          icon={Package}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Managed devices"
          delay={0.7}
        />
        <MetricCard
          title="Contract Status"
          value={metrics.contractStatus}
          icon={Shield}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Service contract status"
          badge={{ text: 'Active', variant: 'default' }}
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
          title="Service Performance"
          icon={BarChart3}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={1.0}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600">Service performance metrics</p>
              <p className="text-sm text-gray-500 mt-1">4.8/5 average rating</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Service Requests Trend"
          icon={TrendingUp}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          delay={1.1}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-600">Service request trends</p>
              <p className="text-sm text-gray-500 mt-1">15 completed this month</p>
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
            title="Service Activity"
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

