'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserCog, 
  Users, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  Settings,
  Wrench,
  Package,
  Database,
  FileText,
  MessageSquare,
  Target,
  Zap,
  Award
} from 'lucide-react'

import { MetricCard } from './metric-card'
import { ChartCard } from './chart-card'
import { ActivityFeed } from './activity-feed'
import { QuickActions } from './quick-actions'

interface TechLeadDashboardProps {
  user: any
}

export function TechLeadDashboard({ user }: TechLeadDashboardProps) {
  const [metrics, setMetrics] = useState({
    teamSize: 8,
    activeTasks: 24,
    completedToday: 16,
    pendingAssignments: 7,
    teamProductivity: 92,
    avgTaskCompletion: 3.2,
    criticalIssues: 2,
    teamSatisfaction: 4.6
  })

  const [activities] = useState([
    {
      id: '1',
      type: 'task' as const,
      title: 'Task assigned to technician',
      description: 'Assigned network maintenance to John Smith',
      user: { name: 'Alex Johnson', initials: 'AJ' },
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      status: 'completed' as const
    },
    {
      id: '2',
      type: 'device' as const,
      title: 'Critical device issue resolved',
      description: 'Resolved server connectivity problem',
      user: { name: 'Sarah Wilson', initials: 'SW' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'completed' as const,
      priority: 'high' as const
    },
    {
      id: '3',
      type: 'customer' as const,
      title: 'Customer escalation handled',
      description: 'Resolved complex technical issue for enterprise client',
      user: { name: 'Mike Davis', initials: 'MD' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      status: 'completed' as const
    },
    {
      id: '4',
      type: 'system' as const,
      title: 'Team performance review',
      description: 'Completed weekly team performance assessment',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'completed' as const
    },
    {
      id: '5',
      type: 'task' as const,
      title: 'New task requires assignment',
      description: 'Emergency repair request needs technician assignment',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      status: 'pending' as const,
      priority: 'critical' as const
    }
  ])

  const quickActions = [
    {
      id: '1',
      title: 'Task Assignment',
      description: 'Assign tasks to team members',
      icon: UserCog,
      href: '/techlead/tasks',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: '2',
      title: 'Technician Management',
      description: 'Manage team members and schedules',
      icon: Users,
      href: '/techlead/technicians',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: '3',
      title: 'Customer Management',
      description: 'Access customer information and history',
      icon: MessageSquare,
      href: '/customers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: '4',
      title: 'Device Management',
      description: 'Monitor and manage device inventory',
      icon: Package,
      href: '/devices',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: '5',
      title: 'Inventory Overview',
      description: 'Check inventory levels and status',
      icon: Database,
      href: '/inventory',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: '6',
      title: 'Contract Management',
      description: 'Review and manage service contracts',
      icon: FileText,
      href: '/contracts',
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
          title="Team Size"
          value={metrics.teamSize}
          change={{ value: 2, type: 'increase' }}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Active technicians"
          delay={0}
        />
        <MetricCard
          title="Active Tasks"
          value={metrics.activeTasks}
          change={{ value: 5, type: 'increase' }}
          icon={ClipboardList}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="Tasks in progress"
          delay={0.1}
        />
        <MetricCard
          title="Completed Today"
          value={metrics.completedToday}
          change={{ value: 18, type: 'increase' }}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Tasks completed"
          delay={0.2}
        />
        <MetricCard
          title="Team Productivity"
          value={`${metrics.teamProductivity}%`}
          change={{ value: 8, type: 'increase' }}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Overall team performance"
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
          title="Pending Assignments"
          value={metrics.pendingAssignments}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Need assignment"
          badge={{ text: 'Action Required', variant: 'destructive' }}
          delay={0.5}
        />
        <MetricCard
          title="Avg Task Completion"
          value={`${metrics.avgTaskCompletion}h`}
          change={{ value: 15, type: 'decrease' }}
          icon={Zap}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          description="Average completion time"
          delay={0.6}
        />
        <MetricCard
          title="Critical Issues"
          value={metrics.criticalIssues}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          description="Require immediate attention"
          badge={{ text: 'Urgent', variant: 'destructive' }}
          delay={0.7}
        />
        <MetricCard
          title="Team Satisfaction"
          value={`${metrics.teamSatisfaction}/5`}
          change={{ value: 3, type: 'increase' }}
          icon={Award}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Team morale score"
          badge={{ text: 'High', variant: 'default' }}
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
          title="Team Performance"
          icon={BarChart3}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={1.0}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600">Team performance metrics</p>
              <p className="text-sm text-gray-500 mt-1">92% productivity score</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Task Distribution"
          icon={Target}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          delay={1.1}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-gray-600">Task distribution chart</p>
              <p className="text-sm text-gray-500 mt-1">24 active, 16 completed</p>
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
            title="Team Activity"
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

