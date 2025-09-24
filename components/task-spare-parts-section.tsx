'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  User,
  TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparePartUsage, getTaskSparePartsUsed } from '@/lib/task-service'
import { format } from 'date-fns'

interface TaskSparePartsSectionProps {
  taskId: number
  taskTitle: string
  onExportClick: () => void
  refreshTrigger?: number // Thêm trigger để refresh data
}

export function TaskSparePartsSection({ 
  taskId, 
  taskTitle, 
  onExportClick,
  refreshTrigger
}: TaskSparePartsSectionProps) {
  const [sparePartsUsed, setSparePartsUsed] = useState<SparePartUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSparePartsUsed()
  }, [taskId, refreshTrigger]) // Thêm refreshTrigger vào dependency

  const loadSparePartsUsed = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading spare parts usage for taskId:', taskId) // Debug log
      const data = await getTaskSparePartsUsed(taskId)
      console.log('Loaded spare parts usage data:', data) // Debug log
      setSparePartsUsed(data)
    } catch (err) {
      setError('Failed to load spare parts usage')
      console.error('Failed to load spare parts usage:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalQuantity = sparePartsUsed.reduce((sum, part) => sum + (part.quantityUsed ?? 0), 0)

  const safeFormatDate = (value?: string, pattern: string = 'MMM dd, yyyy') => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'N/A'
    return format(date, pattern)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Spare Parts Used
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Package className="h-6 w-6" />
              Spare Parts Used
            </CardTitle>
            <CardDescription className="text-blue-700">
              Track spare parts exported for this task
            </CardDescription>
          </div>
          <Button 
            onClick={onExportClick}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Download className="h-4 w-4" />
            Export Parts
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Parts</p>
                    <p className="text-2xl font-bold text-green-900">{totalQuantity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Unique Parts</p>
                    <p className="text-2xl font-bold text-blue-900">{sparePartsUsed.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Spare Parts List */}
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : sparePartsUsed.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Spare Parts Used</h3>
            <p className="text-gray-600 mb-4">
              This task hasn't used any spare parts yet. Click "Export Parts" to start using spare parts.
            </p>
            <Button onClick={onExportClick} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export First Part
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Parts Used in This Task</h3>
              <Badge variant="secondary" className="text-sm">
                {sparePartsUsed.length} part{sparePartsUsed.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {sparePartsUsed.map((part, index) => (
                  <motion.div
                    key={part.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{part.sparePartName}</h4>
                          <Badge variant="outline" className="text-xs font-mono">
                            {part.sparePartCode}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Qty: {part.quantityUsed}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span>Used: <strong>{safeFormatDate(part.usedAt, 'MMM dd, yyyy')}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span>By: <strong>{part.createdBy}</strong></span>
                          </div>
                        </div>

                        {part.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {part.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Recorded by</p>
                          <p className="text-sm font-medium text-gray-900">{part.createdBy}</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <Separator className="my-6" />
            
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Task Summary</h4>
                  <p className="text-sm text-gray-600">
                    Summary of spare parts used in this task
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">{totalQuantity}</p>
                  <p className="text-sm text-blue-600">
                    {totalQuantity} part{totalQuantity !== 1 ? 's' : ''} • {sparePartsUsed.length} type{sparePartsUsed.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
