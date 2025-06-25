'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { getAccessToken } from '@/lib/auth'

interface Props {
  children: React.ReactNode
}

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']

export default function AppShell ({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '')

  // Redirect logic based on authentication state
  useEffect(() => {
    const token = getAccessToken()

    // If not logged in and trying to access a protected page -> redirect to login
    if (!token && !isPublicRoute) {
      router.replace('/login')
      return
    }

    // If logged in and trying to access login/forgot-password -> redirect to dashboard
    if (token && isPublicRoute) {
      router.replace('/dashboard')
    }
  }, [pathname, isPublicRoute, router])

  // If current route is public, render children without shell
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Render full application shell for authenticated routes
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background">
        <Header />
        <section className="p-6">{children}</section>
      </main>
    </div>
  )
} 