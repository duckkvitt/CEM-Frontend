'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
  bgColor: string
}

interface QuickActionsProps {
  title: string
  actions: QuickAction[]
  delay?: number
}

export function QuickActions({ title, actions, delay = 0 }: QuickActionsProps) {
  const router = useRouter()

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
        <CardContent className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto hover:bg-gray-50"
                  onClick={() => router.push(action.href)}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className={`p-3 rounded-lg ${action.bgColor}`}>
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">
                        {action.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}

