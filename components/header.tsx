'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { getCurrentUser, logout as doLogout } from '@/lib/auth'

export default function Header () {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initials, setInitials] = useState('U')

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
    const user = getCurrentUser()
    if (user?.firstName) {
      setInitials(user.firstName.charAt(0).toUpperCase())
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex-1 max-w-lg">
        <input
          type="search"
          placeholder="Search..."
          className="w-full rounded-md border bg-input px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative focus-visible:ring-2 focus-visible:ring-ring rounded-full p-2 text-muted-foreground hover:text-foreground">
          <Bell size={20} />
        </button>
        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
          {initials}
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
          {loading ? 'Signing out...' : 'Logout'}
        </Button>
      </div>
    </header>
  )
} 