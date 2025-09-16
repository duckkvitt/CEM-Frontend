'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import CustomerChatBubble from '@/components/chat/customer-chat-bubble'
import { isAuthenticated, initializeAuthMonitoring } from '@/lib/auth'

interface Props {
  children: React.ReactNode
}

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']

export default function AppShell ({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '')

  useEffect(() => {
    // Initialize authentication monitoring on app startup
    initializeAuthMonitoring()
    
    const authenticated = isAuthenticated()
    if (!authenticated && !isPublicRoute) {
      router.replace('/login')
      return
    }
    if (authenticated && isPublicRoute) {
      router.replace('/dashboard')
    }
  }, [pathname, isPublicRoute, router])

  if (isPublicRoute) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col"> {/* Đã điều chỉnh lề cho sidebar rộng hơn */}
        <Header />
        <main className="flex-1 p-6 lg:p-8"> {/* Thêm nhiều padding hơn */}
          {children}
        </main>
      </div>
      <CustomerChatBubble />
    </div>
  )
} 