'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface ChartCardProps {
  title: string
  icon?: LucideIcon
  iconColor?: string
  bgColor?: string
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ChartCard({
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  bgColor = 'bg-blue-50',
  children,
  className = '',
  delay = 0
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`h-full ${className}`}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
          {Icon && (
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}

