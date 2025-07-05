'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Search, LogOut, UserCircle } from 'lucide-react'
import { getCurrentUser, logout as doLogout, type CurrentUser } from '@/lib/auth'

export default function Header () {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initials, setInitials] = useState('U')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await doLogout()
    } finally {
      setLoading(false)
      router.replace('/login')
    }
  }

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    if (current?.firstName) {
      const first = current.firstName.charAt(0).toUpperCase()
      const last = current.lastName?.charAt(0).toUpperCase() ?? ''
      setInitials(`${first}${last}`)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const navigateAndClose = (path: string) => {
    router.push(path)
    setMenuOpen(false)
  }
  
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur-sm">
      {/* Thanh tìm kiếm được cải thiện */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search..."
          className="w-full rounded-full border bg-input pl-10 pr-4 py-2 text-sm focus:ring-primary focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-4 relative" ref={menuRef}>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
          <Bell size={20} />
          <span className="sr-only">Notifications</span>
        </Button>
        
        {/* Avatar người dùng và menu thả xuống */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-14 w-56 rounded-lg bg-card shadow-xl border p-2 z-50">
            <div className="px-2 py-2 border-b">
              <p className="font-semibold text-sm text-foreground">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="mt-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-1.5 text-sm"
                onClick={() => navigateAndClose('/profile')}
              >
                <UserCircle size={16} /> My Profile
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-1.5 text-sm text-destructive hover:text-destructive"
                disabled={loading}
                onClick={handleLogout}
              >
                <LogOut size={16} /> {loading ? 'Signing out...' : 'Logout'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 