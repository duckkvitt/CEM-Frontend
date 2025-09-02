'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'task' | 'device' | 'customer' | 'inventory' | 'system'
  title: string
  description: string
  user: {
    name: string
    avatar?: string
    initials: string
  }
  timestamp: Date
  status?: 'completed' | 'pending' | 'in-progress' | 'failed'
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

interface ActivityFeedProps {
  title: string
  activities: ActivityItem[]
  maxItems?: number
  delay?: number
}

const typeIcons: Record<ActivityItem['type'], LucideIcon> = {
  task: require('lucide-react').CheckSquare,
  device: require('lucide-react').Package,
  customer: require('lucide-react').Users,
  inventory: require('lucide-react').Warehouse,
  system: require('lucide-react').Settings
}

const typeColors: Record<ActivityItem['type'], string> = {
  task: 'text-blue-600 bg-blue-50',
  device: 'text-green-600 bg-green-50',
  customer: 'text-purple-600 bg-purple-50',
  inventory: 'text-orange-600 bg-orange-50',
  system: 'text-gray-600 bg-gray-50'
}

const statusColors: Record<ActivityItem['status'], string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800'
}

const priorityColors: Record<ActivityItem['priority'], string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

export function ActivityFeed({ title, activities, maxItems = 5, delay = 0 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No recent activity</p>
            </div>
          ) : (
            displayActivities.map((activity, index) => {
              const Icon = typeIcons[activity.type]
              const typeColor = typeColors[activity.type]
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${typeColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2">
                        {activity.status && (
                          <Badge variant="secondary" className={statusColors[activity.status]}>
                            {activity.status.replace('-', ' ')}
                          </Badge>
                        )}
                        {activity.priority && (
                          <Badge variant="outline" className={priorityColors[activity.priority]}>
                            {activity.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {activity.user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">
                          {activity.user.name}
                        </span>
                      </div>
                      
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

