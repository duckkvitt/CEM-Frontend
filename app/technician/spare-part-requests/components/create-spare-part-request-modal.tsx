'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { SPARE_PARTS_SERVICE_URL, DEVICE_SERVICE_URL } from '@/lib/api'

interface SparePart {
  id: number
  partName: string
  partCode: string
  description: string
}

interface Task {
  id: number
  taskId: string
  title: string
  description: string
  status: string
}

interface SparePartAvailability {
  sparePartId: number
  availableQuantity: number
  isLowStock: boolean
  isOutOfStock: boolean
}

interface CreateSparePartRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateSparePartRequestModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateSparePartRequestModalProps) {
  const [formData, setFormData] = useState({
    sparePartId: '',
    taskId: '',
    requestedQuantity: '',
    requestReason: ''
  })
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [availability, setAvailability] = useState<SparePartAvailability | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  useEffect(() => {
    if (open) {
      loadSpareParts()
      loadMyTasks()
    }
  }, [open])

  useEffect(() => {
    if (formData.sparePartId) {
      checkAvailability(parseInt(formData.sparePartId))
    } else {
      setAvailability(null)
    }
  }, [formData.sparePartId])

  const loadSpareParts = async () => {
    try {
      const token = getAccessToken()
      if (!token) return

      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}?page=0&size=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const list = Array.isArray((data as any).data?.content)
          ? (data as any).data.content
          : Array.isArray((data as any).content)
            ? (data as any).content
            : Array.isArray((data as any).data)
              ? (data as any).data
              : []
        setSpareParts(list as unknown as SparePart[])
      }
    } catch (err) {
      console.error('Failed to load spare parts:', err)
    }
  }

  const loadMyTasks = async () => {
    try {
      const token = getAccessToken()
      if (!token) return

      // Get tasks assigned to the current technician
      const response = await fetch(`${DEVICE_SERVICE_URL}/api/tasks/my-tasks?page=0&size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const tasksPage = (data as any).data || data
        const activeTasks = (tasksPage.content || []).filter((task: Task) => 
          task.status === 'IN_PROGRESS' || task.status === 'ASSIGNED'
        )
        setTasks(activeTasks)
      }
    } catch (err) {
      console.error('Failed to load tasks:', err)
    }
  }

  const checkAvailability = async (sparePartId: number) => {
    try {
      setCheckingAvailability(true)
      const token = getAccessToken()
      if (!token) return

      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/availability/${sparePartId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      }
    } catch (err) {
      console.error('Failed to check availability:', err)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = getAccessToken()
      if (!token) {
        setError('Please login to create request')
        return
      }

      // Check if we have enough stock
      const requestedQty = parseInt(formData.requestedQuantity)
      if (availability && availability.availableQuantity < requestedQty) {
        setError(`Not enough stock available. Only ${availability.availableQuantity} units in stock.`)
        setLoading(false)
        return
      }

      const requestBody = {
        sparePartId: parseInt(formData.sparePartId),
        taskId: formData.taskId ? parseInt(formData.taskId) : null,
        requestedQuantity: requestedQty,
        requestReason: formData.requestReason
      }

      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/export-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        onSuccess()
        setFormData({
          sparePartId: '',
          taskId: '',
          requestedQuantity: '',
          requestReason: ''
        })
        setAvailability(null)
      } else {
        const errorData = await response.text()
        setError('Failed to create request: ' + errorData)
      }
    } catch (err) {
      console.error('Error creating request:', err)
      setError('Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getAvailabilityBadge = () => {
    if (!availability) return null
    
    if (availability.isOutOfStock) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Out of Stock</Badge>
    } else if (availability.isLowStock) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />In Stock</Badge>
    }
  }

  const selectedSparePart = spareParts.find(part => part.id.toString() === formData.sparePartId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Spare Parts</DialogTitle>
          <DialogDescription>
            Request spare parts needed for your maintenance tasks
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="sparePart">Spare Part *</Label>
            <Select value={formData.sparePartId} onValueChange={(value) => handleInputChange('sparePartId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select spare part needed" />
              </SelectTrigger>
              <SelectContent>
                {spareParts.map((part) => (
                  <SelectItem key={part.id} value={part.id.toString()}>
                    {part.partName} ({part.partCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Info */}
          {formData.sparePartId && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Stock Availability</span>
                {checkingAvailability ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  getAvailabilityBadge()
                )}
              </div>
              {availability && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{availability.availableQuantity} units available</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task">Related Task</Label>
            <Select value={formData.taskId} onValueChange={(value) => handleInputChange('taskId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select related task (optional)" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id.toString()}>
                    {task.taskId} - {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Needed *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={availability?.availableQuantity || undefined}
              value={formData.requestedQuantity}
              onChange={(e) => handleInputChange('requestedQuantity', e.target.value)}
              placeholder="How many units do you need?"
              required
            />
            {availability && parseInt(formData.requestedQuantity) > availability.availableQuantity && (
              <p className="text-sm text-red-600">
                Requested quantity exceeds available stock ({availability.availableQuantity} available)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Why do you need this spare part? *</Label>
            <Textarea
              id="reason"
              value={formData.requestReason}
              onChange={(e) => handleInputChange('requestReason', e.target.value)}
              placeholder="Explain what repair or maintenance you're performing..."
              required
              className="min-h-[80px]"
            />
          </div>

          {selectedSparePart?.description && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Spare Part Details</h4>
              <p className="text-sm text-blue-700">{selectedSparePart.description}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading || 
                !formData.sparePartId || 
                !formData.requestedQuantity || 
                !formData.requestReason ||
                (!!availability && parseInt(formData.requestedQuantity) > availability.availableQuantity)
              }
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
