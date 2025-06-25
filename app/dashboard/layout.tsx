'use client'

import Sidebar from '@/components/sidebar'
import { ReactNode } from 'react'

export default function DashboardLayout ({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="ml-60 flex-1 bg-background">
        {/* Top bar */}
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
              {/* bell icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
              U
            </div>
          </div>
        </header>
        <section className="p-6">{children}</section>
      </main>
    </div>
  )
} 