'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isAdmin, getCurrentUserRole } from '@/lib/auth'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  UsersRound,
  Bell,
  Settings,
  UserCog,
  HelpCircle,
  Database,
  FileText,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  roles?: string[] // Roles that can access this item
}

export default function Sidebar () {
  const pathname = usePathname()
  const [admin, setAdmin] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure initial render matches server markup; update admin flag after hydration.
  useEffect(() => {
    setAdmin(isAdmin())
    setRole(getCurrentUserRole())
    setMounted(true)
  }, [])

  // Define all authorized roles for contract management
  const contractRoles = ['MANAGER', 'STAFF', 'SUPPORT_TEAM']

  const primary: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { 
      name: 'Customer Management', 
      href: '/customers', 
      icon: <UsersRound size={18} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'TECH_LEAD', 'TECHNICIAN']
    },
    { 
      name: 'Device Management', 
      href: '/devices', 
      icon: <Database size={18} />,
      roles: ['MANAGER', 'STAFF', 'SUPPORT_TEAM', 'TECH_LEAD', 'TECHNICIAN'] 
    },
    { 
      name: 'Contract Management', 
      href: '/contracts', 
      icon: <FileText size={18} />,
      roles: contractRoles
    },
    { name: 'Maintenance', href: '/maintenance', icon: <Database size={18} /> },
    { name: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  ]

  const others: NavItem[] = [
    { name: 'Settings', href: '/settings', icon: <Settings size={18} /> },
    { name: 'User Management', href: '/users', icon: <UserCog size={18} />, roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Help', href: '/help', icon: <HelpCircle size={18} /> },
    { name: 'Bot', href: '/bot', icon: <HelpCircle size={18} /> },
  ]

  // Function to check if the current user has access to a nav item
  function hasAccess(item: NavItem): boolean {
    if (!mounted) return false; // Don't show restricted items during SSR
    if (!item.roles) return true; // No role restriction
    if (!role) return false; // No user role, no access
    
    return item.roles.includes(role);
  }

  const renderLink = (item: NavItem) => {
    // If user doesn't have access to this item, don't render it
    if (item.roles && !hasAccess(item)) {
      return null;
    }
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          pathname === item.href
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        {item.icon}
        <span>{item.name}</span>
      </Link>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r bg-sidebar p-4 flex flex-col gap-6">
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">C</div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer &amp; Equipment</span>
          <span className="text-sm font-semibold">Management System</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <span className="px-3 text-xs font-semibold text-muted-foreground">Menu</span>
        {primary.map((item) => renderLink(item))}
      </nav>

      <nav className="mt-auto flex flex-col gap-2">
        <span className="px-3 text-xs font-semibold text-muted-foreground">Others</span>
        {others.map((item) => renderLink(item))}
      </nav>
    </aside>
  )
} 