'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Search, Users, Cpu, FileText, MessageSquarePlus, UserPlus, LayoutDashboard, FileSignature } from 'lucide-react'
import { getCustomers } from '@/lib/customer-service'
import { getCustomerDevices } from '@/lib/device-service'
import { getCurrentUserRole } from '@/lib/auth'
import { NAV_ITEMS } from '@/lib/nav-config'

type PaletteItem = {
  id: string
  title: string
  subtitle?: string
  icon: JSX.Element
  group: 'Navigate' | 'Actions' | 'Customers' | 'Devices' | 'Contracts'
  onRun: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuery?: string
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CommandPalette({ open, onOpenChange, initialQuery = '' }: CommandPaletteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebouncedValue(query)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PaletteItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
      setResults([])
      setActiveIndex(0)
    }
  }, [open])

  const staticItems = useMemo<PaletteItem[]>(() => {
    const role = getCurrentUserRole()
    const allowedRoutes = NAV_ITEMS
      .filter(n => !n.roles || (role && n.roles.includes(role as any)))
      // Exclude dynamic routes like "/[id]" from palette
      .filter(n => !n.href.includes('[') && !n.href.includes(']'))
    const routeItems: PaletteItem[] = allowedRoutes.map(n => ({
      id: `route-${n.href}`,
      title: n.name,
      subtitle: n.href,
      icon: (n.icon as any) ?? <LayoutDashboard className="h-4 w-4" />,
      group: 'Navigate',
      onRun: () => router.push(n.href),
    }))

    const actions: PaletteItem[] = []
    // Example actions gated by role
    if (role && (role === 'MANAGER' || role === 'STAFF')) {
      actions.push({ id: 'action-new-customer', title: 'Create Customer', icon: <UserPlus className="h-4 w-4" />, group: 'Actions', onRun: () => router.push('/customers/create') })
    }
    if (role && (role === 'SUPPORT_TEAM')) {
      actions.push({ id: 'action-new-service-request', title: 'Create Service Request', subtitle: 'Support Center', icon: <MessageSquarePlus className="h-4 w-4" />, group: 'Actions', onRun: () => router.push('/support/service-requests?create=1') })
    }
    if (role && (role === 'MANAGER' || role === 'STAFF')) {
      actions.push({ id: 'action-new-contract', title: 'Create Contract', icon: <FileSignature className="h-4 w-4" />, group: 'Actions', onRun: () => router.push('/contracts?create=1') })
    }

    return routeItems.concat(actions)
  }, [router])

  const filterLocal = useCallback((items: PaletteItem[], q: string) => {
    if (!q) return items
    const needle = q.toLowerCase()
    return items.filter(i =>
      i.title.toLowerCase().includes(needle) ||
      (i.subtitle?.toLowerCase().includes(needle) ?? false)
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    async function runSearch() {
      setLoading(true)
      try {
        const local = filterLocal(staticItems, debouncedQuery)

        if (!debouncedQuery) {
          if (!cancelled) setResults(local)
          return
        }

        const [customersPage, devicesPage] = await Promise.all([
          getCustomers(0, 5, debouncedQuery).catch(() => ({ content: [] } as any)),
          getCustomerDevices({ keyword: debouncedQuery, page: 0, size: 5 }).catch(() => ({ content: [] } as any)),
        ])

        const customerItems: PaletteItem[] = (customersPage.content || []).map((c: any) => ({
          id: `cust-${c.id}`,
          title: c.name,
          subtitle: c.email || c.phone,
          icon: <Users className="h-4 w-4" />,
          group: 'Customers',
          onRun: () => router.push(`/customers/${c.id}`)
        }))

        const deviceItems: PaletteItem[] = (devicesPage.content || []).map((d: any) => ({
          id: `dev-${d.id}`,
          title: d.deviceName || d.deviceModel || 'Device',
          subtitle: d.serialNumber ? `SN ${d.serialNumber}` : undefined,
          icon: <Cpu className="h-4 w-4" />,
          group: 'Devices',
          onRun: () => router.push(`/devices/${d.id}`)
        }))

        // Gate entity search results by role contexts
        const role = getCurrentUserRole()
        const entityItems: PaletteItem[] = []
        // Only staff/manager/support/lead/technician see customers/devices entities globally
        const canSeeEntities = role && ['MANAGER','STAFF','SUPPORT_TEAM','LEAD_TECH','TECHNICIAN','ADMIN','SUPER_ADMIN'].includes(role)
        if (canSeeEntities) {
          entityItems.push(...customerItems, ...deviceItems)
        }

        const merged = [...local, ...entityItems]
        if (!cancelled) setResults(merged)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    runSearch()
    return () => { cancelled = true }
  }, [debouncedQuery, filterLocal, router, staticItems])

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteItem[]>()
    for (const item of results) {
      const arr = map.get(item.group) || []
      arr.push(item)
      map.set(item.group, arr)
    }
    return Array.from(map.entries())
  }, [results])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[activeIndex]
        if (item) {
          onOpenChange(false)
          item.onRun()
        }
      }
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, activeIndex, onOpenChange])

  useEffect(() => {
    // Close palette if route changed
    onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-2xl" showCloseButton={false}>
        <div className="border-b p-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search anything… (customers, devices, actions)"
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground border rounded px-1 py-0.5">Ctrl K</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-4 text-sm text-muted-foreground">Searching…</div>
          )}
          {!loading && grouped.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No results</div>
          )}
          {!loading && grouped.map(([groupName, items]) => (
            <div key={groupName} className="py-2">
              <div className="px-4 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">{groupName}</div>
              <ul className="px-2">
                {items.map((item, idx) => {
                  const flatIndex = results.findIndex(r => r.id === item.id)
                  const active = flatIndex === activeIndex
                  return (
                    <li key={item.id}>
                      <button
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => { onOpenChange(false); item.onRun() }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${active ? 'bg-accent' : 'hover:bg-accent/70'}`}
                      >
                        <span className="text-muted-foreground">{item.icon}</span>
                        <span className="flex-1">
                          <div className="text-sm">{item.title}</div>
                          {item.subtitle && <div className="text-xs text-muted-foreground">{item.subtitle}</div>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}


