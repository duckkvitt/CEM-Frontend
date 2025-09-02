'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon: LucideIcon
  iconColor?: string
  bgColor?: string
  description?: string
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  delay?: number
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-blue-600',
  bgColor = 'bg-blue-50',
  description,
  badge,
  delay = 0
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (change?.type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getChangeIcon = () => {
    switch (change?.type) {
      case 'increase':
        return '↗'
      case 'decrease':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            
            {change && (
              <div className={`flex items-center gap-1 text-sm ${getChangeColor()}`}>
                <span className="text-lg">{getChangeIcon()}</span>
                <span className="font-medium">
                  {Math.abs(change.value)}%
                </span>
                <span className="text-gray-500">from last month</span>
              </div>
            )}
            
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
            
            {badge && (
              <Badge variant={badge.variant} className="mt-2">
                {badge.text}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

