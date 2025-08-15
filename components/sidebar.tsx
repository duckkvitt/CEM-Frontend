'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  UsersRound,
  Database,
  FileText,
  BotMessageSquare,
  Wrench,
  ShieldCheck,
  MessageCircle,
  Package,
  Store,
  ClipboardList,
  Calendar,
  Users,
  UserCog,
  CheckSquare,
  Clock,
  Warehouse,
  BarChart3,
  PackageOpen,
  Truck,
  History,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  roles?: string[] // Roles that can access this item
}

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setRole(getCurrentUserRole())
    setMounted(true)
  }, [])

  const primary: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    // Support Team Menu Items
    {
      name: 'Support Chat',
      href: '/support',
      icon: <MessageCircle size={20} />,
      roles: ['SUPPORT_TEAM'],
    },
    {
      name: 'Service Request Management',
      href: '/support/service-requests',
      icon: <MessageCircle size={20} />,
      roles: ['SUPPORT_TEAM'],
    },
    {
      name: 'Task Management',
      href: '/support/tasks',
      icon: <ClipboardList size={20} />,
      roles: ['SUPPORT_TEAM'],
    },
    // TechLead Menu Items
    {
      name: 'Task Assignment',
      href: '/techlead/tasks',
      icon: <UserCog size={20} />,
      roles: ['LEAD_TECH'],
    },
    {
      name: 'Technician Management',
      href: '/techlead/technicians',
      icon: <Users size={20} />,
      roles: ['LEAD_TECH'],
    },
    // Technician Menu Items
    {
      name: 'Work Schedule',
      href: '/technician/schedule',
      icon: <Calendar size={20} />,
      roles: ['TECHNICIAN'],
    },
    {
      name: 'My Tasks',
      href: '/technician/tasks',
      icon: <CheckSquare size={20} />,
      roles: ['TECHNICIAN'],
    },
    {
      name: 'Request Spare Parts',
      href: '/technician/spare-part-requests',
      icon: <PackageOpen size={20} />,
      roles: ['TECHNICIAN'],
    },
    // General Management Items
    {
      name: 'Customer Management',
      href: '/customers',
      icon: <UsersRound size={20} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'LEAD_TECH', 'TECHNICIAN'],
    },
    {
      name: 'Device Management',
      href: '/devices',
      icon: <Database size={20} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'LEAD_TECH', 'TECHNICIAN'],
    },
    {
      name: 'Spare Part Management',
      href: '/spare-parts',
      icon: <Wrench size={20} />,
      roles: ['MANAGER', 'STAFF'],
    },
    {
      name: 'Supplier Management',
      href: '/suppliers',
      icon: <Store size={20} />,
      roles: ['MANAGER'],
    },
    {
      name: 'Contract Management',
      href: '/contracts',
      icon: <FileText size={20} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'CUSTOMER'],
    },
    // Warehouse Management Items
    {
      name: 'Warehouse Dashboard',
      href: '/warehouse',
      icon: <Warehouse size={20} />,
      roles: ['MANAGER'],
    },
    {
      name: 'Inventory Overview',
      href: '/warehouse/inventory',
      icon: <BarChart3 size={20} />,
      roles: ['MANAGER', 'STAFF'],
    },
    {
      name: 'Import Requests',
      href: '/warehouse/import-requests',
      icon: <Truck size={20} />,
      roles: ['MANAGER', 'STAFF'],
    },
    {
      name: 'Export Requests',
      href: '/warehouse/export-requests',
      icon: <PackageOpen size={20} />,
      roles: ['MANAGER', 'STAFF'],
    },
    {
      name: 'Inventory Transactions',
      href: '/warehouse/transactions',
      icon: <History size={20} />,
      roles: ['MANAGER', 'STAFF'],
    },
    // Customer Menu Items
    {
      name: 'My Devices',
      href: '/my-devices',
      icon: <Package size={20} />,
      roles: ['CUSTOMER'],
    },
    {
      name: 'Service Requests',
      href: '/service-requests',
      icon: <Clock size={20} />,
      roles: ['CUSTOMER'],
    },
    // Other Items
  ]

  const others: NavItem[] = [
    {
      name: 'User Management',
      href: '/users',
      icon: <ShieldCheck size={20} />,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Customer User Management',
      href: '/users/customers',
      icon: <UsersRound size={20} />,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    { name: 'Bot', href: '/bot', icon: <BotMessageSquare size={20} /> },
  ]

  function hasAccess(item: NavItem): boolean {
    if (!mounted) return false
    if (!item.roles) return true
    if (!role) return false
    return item.roles.includes(role)
  }

  const renderLink = (item: NavItem) => {
    if (!hasAccess(item)) {
      return null
    }

    // Handle active state for specific routes
    let isActive = false
    if (item.href === '/dashboard') {
      isActive = pathname === item.href
    } else if (item.href === '/users') {
      isActive = pathname === item.href
    } else if (item.href === '/users/customers') {
      isActive = pathname === item.href
    } else if (item.href === '/support/service-requests') {
      isActive = pathname.startsWith('/support/service-requests')
    } else if (item.href === '/support/tasks') {
      isActive = pathname.startsWith('/support/tasks')
    } else if (item.href === '/support') {
      isActive = pathname === '/support'
    } else if (item.href === '/techlead/tasks') {
      isActive = pathname.startsWith('/techlead/tasks')
    } else if (item.href === '/techlead/technicians') {
      isActive = pathname.startsWith('/techlead/technicians')
    } else if (item.href === '/technician/schedule') {
      isActive = pathname.startsWith('/technician/schedule')
    } else if (item.href === '/technician/tasks') {
      isActive = pathname.startsWith('/technician/tasks')
    } else if (item.href === '/technician/spare-part-requests') {
      isActive = pathname.startsWith('/technician/spare-part-requests')
    } else if (item.href === '/warehouse') {
      isActive = pathname === '/warehouse'
    } else if (item.href.startsWith('/warehouse/')) {
      isActive = pathname.startsWith(item.href)
    } else {
      isActive = pathname.startsWith(item.href)
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-4 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-inner'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
      >
        {item.icon}
        <span className="truncate">{item.name}</span>
      </Link>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-4 flex flex-col gap-8">
      <div className="flex items-center gap-3 px-2">
        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
          C
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-sidebar-foreground">
            CEM System
          </span>
          <span className="text-xs text-sidebar-foreground/60">v1.0.0</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <span className="px-4 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 mb-1">
          Menu
        </span>
        <div className="flex flex-col gap-1">{primary.map(renderLink)}</div>
      </nav>

      <nav className="mt-auto flex flex-col gap-2">
        <span className="px-4 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 mb-1">
          Others
        </span>
        <div className="flex flex-col gap-1">{others.map(renderLink)}</div>
      </nav>
    </aside>
  )
} 