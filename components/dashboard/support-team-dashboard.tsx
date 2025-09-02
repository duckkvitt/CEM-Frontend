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
  Star
} from 'lucide-react'

import { MetricCard } from './metric-card'
import { ChartCard } from './chart-card'
import { ActivityFeed } from './activity-feed'
import { QuickActions } from './quick-actions'

interface SupportTeamDashboardProps {
  user: any
}

export function SupportTeamDashboard({ user }: SupportTeamDashboardProps) {
  const [metrics, setMetrics] = useState({
    openTickets: 23,
    resolvedToday: 18,
    avgResponseTime: 2.5,
    customerSatisfaction: 4.8,
    activeChats: 7,
    pendingEscalations: 3,
    totalTickets: 156,
    firstCallResolution: 78
  })

  const [activities] = useState([
    {
      id: '1',
      type: 'task' as const,
      title: 'Critical ticket resolved',
      description: 'Resolved network connectivity issue for TechCorp Inc.',
      user: { name: 'Sarah Johnson', initials: 'SJ' },
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      status: 'completed' as const,
      priority: 'high' as const
    },
    {
      id: '2',
      type: 'customer' as const,
      title: 'New support ticket created',
      description: 'Customer reported device malfunction',
      user: { name: 'Mike Davis', initials: 'MD' },
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      status: 'pending' as const
    },
    {
      id: '3',
      type: 'system' as const,
      title: 'Chat session started',
      description: 'Live chat with customer about billing inquiry',
      user: { name: 'Lisa Chen', initials: 'LC' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      status: 'in-progress' as const
    },
    {
      id: '4',
      type: 'task' as const,
      title: 'Ticket escalated to technical team',
      description: 'Complex hardware issue requires specialist',
      user: { name: 'John Smith', initials: 'JS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'pending' as const,
      priority: 'high' as const
    },
    {
      id: '5',
      type: 'customer' as const,
      title: 'Customer satisfaction survey completed',
      description: '5-star rating received from recent interaction',
      user: { name: 'System', initials: 'SYS' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      status: 'completed' as const
    }
  ])

  const quickActions = [
    {
      id: '1',
      title: 'Support Chat',
      description: 'Start live chat with customers',
      icon: MessageSquare,
      href: '/support',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: '2',
      title: 'Service Requests',
      description: 'Manage customer service requests',
      icon: FileText,
      href: '/support/service-requests',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: '3',
      title: 'Task Management',
      description: 'View and assign support tasks',
      icon: Activity,
      href: '/support/tasks',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: '4',
      title: 'Customer Management',
      description: 'Access customer information',
      icon: Users,
      href: '/customers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: '5',
      title: 'Knowledge Base',
      description: 'Access support documentation',
      icon: FileText,
      href: '/knowledge-base',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: '6',
      title: 'Bot Assistant',
      description: 'Configure AI support bot',
      icon: Bot,
      href: '/bot',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
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
          title="Open Tickets"
          value={metrics.openTickets}
          change={{ value: 8, type: 'decrease' }}
          icon={MessageSquare}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Awaiting resolution"
          badge={{ text: 'Priority', variant: 'destructive' }}
          delay={0}
        />
        <MetricCard
          title="Resolved Today"
          value={metrics.resolvedToday}
          change={{ value: 25, type: 'increase' }}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Tickets closed today"
          delay={0.1}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.avgResponseTime}h`}
          change={{ value: 12, type: 'decrease' }}
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          description="First response time"
          delay={0.2}
        />
        <MetricCard
          title="Customer Satisfaction"
          value={`${metrics.customerSatisfaction}/5`}
          change={{ value: 5, type: 'increase' }}
          icon={Star}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          description="Average rating"
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
          title="Active Chats"
          value={metrics.activeChats}
          icon={Headphones}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          description="Live conversations"
          delay={0.5}
        />
        <MetricCard
          title="Pending Escalations"
          value={metrics.pendingEscalations}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          description="Require specialist"
          badge={{ text: 'Urgent', variant: 'destructive' }}
          delay={0.6}
        />
        <MetricCard
          title="Total Tickets"
          value={metrics.totalTickets}
          change={{ value: 18, type: 'increase' }}
          icon={FileText}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          description="This month"
          delay={0.7}
        />
        <MetricCard
          title="First Call Resolution"
          value={`${metrics.firstCallResolution}%`}
          change={{ value: 8, type: 'increase' }}
          icon={Zap}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Resolved on first contact"
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
          title="Ticket Volume Trend"
          icon={TrendingUp}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={1.0}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600">Support ticket analytics</p>
              <p className="text-sm text-gray-500 mt-1">23 open, 18 resolved today</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Response Time Analysis"
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          delay={1.1}
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <p className="text-gray-600">Response time metrics</p>
              <p className="text-sm text-gray-500 mt-1">2.5h average response time</p>
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
            title="Support Activity"
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

