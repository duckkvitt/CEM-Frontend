'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUserRole, getCurrentUser } from '@/lib/auth'
import { isAuthenticated } from '@/lib/api/client'
import { 
  Users, 
  Package, 
  Wrench, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  UserCog,
  ClipboardList,
  FileText,
  Database,
  Warehouse,
  History,
  Upload,
  Download,
  Shield,
  Bot
} from 'lucide-react'

// Import dashboard components
import { MetricCard } from '@/components/dashboard/metric-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { QuickActions } from '@/components/dashboard/quick-actions'

// Import role-specific dashboard components
import { ManagerDashboard } from '@/components/dashboard/manager-dashboard'
import { SupportTeamDashboard } from '@/components/dashboard/support-team-dashboard'
import { StaffDashboard } from '@/components/dashboard/staff-dashboard'
import { TechLeadDashboard } from '@/components/dashboard/tech-lead-dashboard'
import { TechnicianDashboard } from '@/components/dashboard/technician-dashboard'
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const currentRole = getCurrentUserRole()
    const currentUser = getCurrentUser()
    
    setRole(currentRole)
    setUser(currentUser)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const renderRoleDashboard = () => {
    switch (role) {
      case 'MANAGER':
        return <ManagerDashboard user={user} />
      case 'SUPPORT_TEAM':
        return <SupportTeamDashboard user={user} />
      case 'STAFF':
        return <StaffDashboard user={user} />
      case 'LEAD_TECH':
      case 'TECH_LEAD':
        return <TechLeadDashboard user={user} />
      case 'TECHNICIAN':
        return <TechnicianDashboard user={user} />
      case 'CUSTOMER':
        return <CustomerDashboard user={user} />
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <AdminDashboard user={user} />
      default:
        return <DefaultDashboard user={user} role={role} />
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your {role?.toLowerCase().replace('_', ' ')} dashboard today.
          </p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {role?.replace('_', ' ')} Dashboard
          </span>
        </motion.div>
      </motion.div>

      {renderRoleDashboard()}
    </div>
  )
}

// Default dashboard for unknown roles
function DefaultDashboard({ user, role }: { user: any; role: string | null }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to CEM System
        </h2>
        <p className="text-gray-600 mb-4">
          Your role ({role}) doesn't have a specific dashboard yet.
        </p>
        <p className="text-sm text-gray-500">
          Contact your administrator to set up your dashboard.
        </p>
      </motion.div>
    </div>
  )
} 