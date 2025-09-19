import React from 'react'
import {
  LayoutDashboard,
  UsersRound,
  Database,
  FileText,
  Wrench,
  ShieldCheck,
  MessageCircle,
  MessageSquare,
  Package,
  Store,
  ClipboardList,
  Calendar,
  Users,
  CheckSquare,
  Warehouse,
  BarChart3,
  History,
  Upload,
} from 'lucide-react'

export type AppRole = 'ADMIN' | 'SUPER_ADMIN' | 'MANAGER' | 'STAFF' | 'SUPPORT_TEAM' | 'LEAD_TECH' | 'TECHNICIAN' | 'CUSTOMER'

export interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  roles?: AppRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },

  // Support
  { name: 'Support Chat', href: '/support', icon: <MessageCircle size={20} />, roles: ['SUPPORT_TEAM'] },
  { name: 'Feedback', href: '/support/feedback', icon: <MessageSquare size={20} />, roles: ['SUPPORT_TEAM', 'MANAGER'] },
  { name: 'Service Request Management', href: '/support/service-requests', icon: <MessageCircle size={20} />, roles: ['SUPPORT_TEAM'] },
  { name: 'Task Management', href: '/support/tasks', icon: <ClipboardList size={20} />, roles: ['SUPPORT_TEAM'] },

  // Tech Lead
  { name: 'Task Assignment', href: '/techlead/tasks', icon: <Users size={20} />, roles: ['LEAD_TECH'] },
  { name: 'Technician Management', href: '/techlead/technicians', icon: <Users size={20} />, roles: ['LEAD_TECH'] },

  // Technician
  { name: 'Work Schedule', href: '/technician/schedule', icon: <Calendar size={20} />, roles: ['TECHNICIAN'] },
  { name: 'My Tasks', href: '/technician/tasks', icon: <CheckSquare size={20} />, roles: ['TECHNICIAN'] },

  // General Management
  { name: 'Customer Management', href: '/customers', icon: <UsersRound size={20} />, roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'LEAD_TECH', 'TECHNICIAN'] },
  { name: 'Create Customer', href: '/customers/create', icon: <UsersRound size={20} />, roles: ['MANAGER', 'STAFF'] },
  { name: 'Device Management', href: '/devices', icon: <Database size={20} />, roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'LEAD_TECH', 'TECHNICIAN'] },
  { name: 'Create Device', href: '/devices/create', icon: <Database size={20} />, roles: ['MANAGER', 'STAFF'] },
  { name: 'Spare Part Management', href: '/spare-parts', icon: <Wrench size={20} />, roles: ['MANAGER', 'STAFF'] },
  { name: 'Create Spare Part', href: '/spare-parts/create', icon: <Wrench size={20} />, roles: ['MANAGER', 'STAFF'] },
  { name: 'Supplier Management', href: '/suppliers', icon: <Store size={20} />, roles: ['MANAGER'] },
  { name: 'Create Supplier', href: '/suppliers/create', icon: <Store size={20} />, roles: ['MANAGER'] },
  { name: 'Contract Management', href: '/contracts', icon: <FileText size={20} />, roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'CUSTOMER'] },

  // Inventory
  { name: 'Inventory Overview', href: '/inventory', icon: <Warehouse size={20} />, roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'LEAD_TECH'] },
  { name: 'Import Inventory', href: '/inventory/import', icon: <Upload size={20} />, roles: ['STAFF'] },
  { name: 'Inventory Transactions', href: '/inventory/transactions', icon: <History size={20} />, roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'LEAD_TECH'] },
  { name: 'Warehouse Dashboard', href: '/inventory/dashboard', icon: <BarChart3 size={20} />, roles: ['MANAGER', 'LEAD_TECH', 'SUPPORT_TEAM'] },

  // Customer
  { name: 'My Devices', href: '/my-devices', icon: <Package size={20} />, roles: ['CUSTOMER'] },
  { name: 'Service Requests', href: '/service-requests', icon: <History size={20} />, roles: ['CUSTOMER'] },

  // Admin
  { name: 'User Management', href: '/users', icon: <ShieldCheck size={20} />, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { name: 'Customer User Management', href: '/users/customers', icon: <UsersRound size={20} />, roles: ['ADMIN', 'SUPER_ADMIN'] },

  // Profile (available to all authenticated users)
  { name: 'My Profile', href: '/profile', icon: <ShieldCheck size={20} /> },
  { name: 'Edit Profile', href: '/profile/edit', icon: <ShieldCheck size={20} /> },
  { name: 'Change Password', href: '/profile/change-password', icon: <ShieldCheck size={20} /> },
]

export const GROUPS: Record<string, string[]> = {
  dashboard: ['/dashboard'],
  support: ['/support', '/support/feedback', '/support/service-requests', '/support/tasks'],
  techlead: ['/techlead/tasks', '/techlead/technicians'],
  technician: ['/technician/schedule', '/technician/tasks'],
  management: ['/customers', '/customers/create', '/devices', '/devices/create', '/spare-parts', '/spare-parts/create', '/suppliers', '/suppliers/create', '/contracts'],
  inventory: ['/inventory', '/inventory/import', '/inventory/transactions', '/inventory/dashboard'],
  customer: ['/my-devices', '/service-requests'],
  admin: ['/users', '/users/customers'],
  profile: ['/profile', '/profile/edit', '/profile/change-password'],
}


