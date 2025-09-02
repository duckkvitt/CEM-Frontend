'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Wrench, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  Settings,
  Package,
  Database,
  FileText,
  MessageSquare,
  Target,
  Zap,
  Award,
  MapPin,
  User,
  Phone,
  Mail
} from 'lucide-react'

import { MetricCard } from './metric-card'
import { ChartCard } from './chart-card'
import { ActivityFeed } from './activity-feed'
import { QuickActions } from './quick-actions'

interface TechnicianDashboardProps {
  user: any
}

export function TechnicianDashboard({ user }: TechnicianDashboardProps) {
  const [metrics, setMetrics] = useState({
    assignedTasks: 8,
    completedToday: 5,
    pendingTasks: 3,
    avgCompletionTime: 2.8,
    customerRating: 4.7,
    activeRepairs: 2,
    scheduledMaintenance: 4,
    productivityScore: 89
  })

  const [activities] = useState([
    {
      id: '1',
      type: 'task' as const,
      title: 'Device repair completed',
      description: 'Successfully repaired network switch for TechCorp Inc.',
      user: { name: 'John Smith', initials: 'JS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      status: 'completed' as const
    },
    {
      id: '2',
      type: 'device' as const,
      title: 'Maintenance scheduled',
      description: 'Scheduled routine maintenance for server room equipment',
      user: { name: 'Sarah Wilson', initials: 'SW' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      status: 'in-progress' as const
    },
    {
      id: '3',
      type: 'customer' as const,
      title: 'Customer service call',
      description: 'On-site visit completed for connectivity issue',
      user: { name: 'Mike Davis', initials: 'MD' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'completed' as const
    },
    {
      id: '4',
      type: 'task' as const,
      title: 'New task assigned',
      description: 'Emergency repair request for data center equipment',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      status: 'pending' as const,
      priority: 'high' as const
    },
    {
      id: '5',
      type: 'system' as const,
      title: 'Performance review updated',
      description: 'Weekly performance metrics updated',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'completed' as const
    }
  ])

  const quickActions = [
    {
      id: '1',
      title: 'My Tasks',
      description: 'View and manage assigned tasks',
      icon: ClipboardList,
      href: '/technician/tasks',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: '2',
      title: 'Device Management',
      description: 'Access device information and history',
      icon: Package,
      href: '/devices',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: '3',
      title: 'Customer Management',
      description: 'View customer information and service history',
      icon: User,
      href: '/customers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: '4',
      title: 'Inventory Check',
      description: 'Check spare parts and equipment availability',
      icon: Database,
      href: '/inventory',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: '5',
      title: 'Service Reports',
      description: 'Submit and view service reports',
      icon: FileText,
      href: '/technician/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: '6',
      title: 'Schedule',
      description: 'View upcoming appointments and tasks',
      icon: Calendar,
      href: '/technician/schedule',
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
          change={{ value: 2, type: 'increase' }}
          icon={ClipboardList}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Tasks assigned to you"
          delay={0}
        />
        <MetricCard
          title="Completed Today"
          value={metrics.completedToday}
          change={{ value: 25, type: 'increase' }}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Tasks completed today"
          delay={0.1}
        />
        <MetricCard
          title="Pending Tasks"
          value={metrics.pendingTasks}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Awaiting completion"
          badge={{ text: 'Action Required', variant: 'destructive' }}
          delay={0.2}
        />
        <MetricCard
          title="Customer Rating"
          value={`${metrics.customerRating}/5`}
          change={{ value: 8, type: 'increase' }}
          icon={Award}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Average customer rating"
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
          title="Avg Completion Time"
          value={`${metrics.avgCompletionTime}h`}
          change={{ value: 12, type: 'decrease' }}
          icon={Zap}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          description="Average task completion time"
          delay={0.5}
        />
        <MetricCard
          title="Active Repairs"
          value={metrics.activeRepairs}
          icon={Wrench}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Currently in progress"
          delay={0.6}
        />
        <MetricCard
          title="Scheduled Maintenance"
          value={metrics.scheduledMaintenance}
          icon={Calendar}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          description="Upcoming maintenance tasks"
          delay={0.7}
        />
        <MetricCard
          title="Productivity Score"
          value={`${metrics.productivityScore}%`}
          change={{ value: 6, type: 'increase' }}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="This week's performance"
          badge={{ text: 'Great', variant: 'default' }}
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
              <p className="text-sm text-gray-500 mt-1">89% completion rate this week</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Service Performance"
          icon={Target}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          delay={1.1}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-gray-600">Service performance metrics</p>
              <p className="text-sm text-gray-500 mt-1">4.7/5 customer rating</p>
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

