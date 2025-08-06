'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  UsersRound,
  Bell,
  Settings,
  HelpCircle,
  Database,
  FileText,
  BotMessageSquare,
  Wrench,
  ShieldCheck,
  MessageCircle,
  Package,
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
    {
      name: 'Customer Support',
      href: '/support',
      icon: <MessageCircle size={20} />,
      roles: ['SUPPORT_TEAM'],
    },
    {
      name: 'Customer Management',
      href: '/customers',
      icon: <UsersRound size={20} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'TECH_LEAD', 'TECHNICIAN'],
    },
    {
      name: 'Device Management',
      href: '/devices',
      icon: <Database size={20} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'TECH_LEAD', 'TECHNICIAN'],
    },
    {
      name: 'Spare Part Management',
      href: '/spare-parts',
      icon: <Wrench size={20} />,
      roles: ['MANAGER', 'STAFF'],
    },
    {
      name: 'Contract Management',
      href: '/contracts',
      icon: <FileText size={20} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'CUSTOMER'],
    },
    {
      name: 'My Devices',
      href: '/my-devices',
      icon: <Package size={20} />,
      roles: ['CUSTOMER'],
    },
    { name: 'Maintenance', href: '/maintenance', icon: <Wrench size={20} /> },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: <Bell size={20} />,
    },
  ]

  const others: NavItem[] = [
    { name: 'Settings', href: '/settings', icon: <Settings size={20} /> },
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
    { name: 'Help', href: '/help', icon: <HelpCircle size={20} /> },
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