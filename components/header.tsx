'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { getCurrentUser, logout as doLogout, type CurrentUser } from '@/lib/auth'

export default function Header () {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initials, setInitials] = useState('U')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      await doLogout()
    } catch (err) {
      // even if logout API fails, proceed with client-side cleanup
    } finally {
      setLoading(false)
      router.replace('/login')
    }
  }

  // Avoid reading localStorage on server-side; only after mount.
  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    if (current?.firstName) {
      const first = current.firstName.charAt(0).toUpperCase()
      const last = current.lastName?.charAt(0).toUpperCase() ?? ''
      setInitials(`${first}${last}`)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex-1 max-w-lg">
        <input
          type="search"
          placeholder="Search..."
          className="w-full rounded-md border bg-input px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      <div className="flex items-center gap-4 relative" ref={menuRef}>
        <button className="relative focus-visible:ring-2 focus-visible:ring-ring rounded-full p-2 text-muted-foreground hover:text-foreground">
          <Bell size={20} />
        </button>
        {user && (
          <>
            <span className="text-sm font-medium whitespace-nowrap hidden sm:block">
              {user.firstName} {user.lastName}
            </span>
            {user.role?.name && (
              <span className="text-xs text-muted-foreground hidden sm:block">({user.role.name})</span>
            )}
          </>
        )}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold focus-visible:ring-2 focus-visible:ring-ring"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-44 rounded-md bg-background shadow-lg py-1 z-50">
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 text-sm"
              onClick={() => {
                setMenuOpen(false)
                router.push('/profile')
              }}
            >
              My Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 text-sm"
              disabled={loading}
              onClick={async () => {
                setMenuOpen(false)
                await handleLogout()
              }}
            >
              {loading ? 'Signing out...' : 'Logout'}
            </Button>
          </div>
        )}
      </div>
    </header>
  )
} 