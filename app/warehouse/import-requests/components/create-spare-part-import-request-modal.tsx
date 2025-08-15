'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { SPARE_PARTS_SERVICE_URL, SUPPLIERS_SERVICE_URL } from '@/lib/api'

interface SparePart {
  id: number
  partName: string
  partCode: string
  description: string
}

interface Supplier {
  id: number
  companyName: string
}

interface CreateSparePartImportRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateSparePartImportRequestModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateSparePartImportRequestModalProps) {
  const [formData, setFormData] = useState({
    sparePartId: '',
    supplierId: '',
    requestedQuantity: '',
    unitPrice: '',
    requestReason: '',
    expectedDeliveryDate: ''
  })
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      loadSpareParts()
      loadSuppliers()
    }
  }, [open])

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

  const loadSuppliers = async () => {
    try {
      const token = getAccessToken()
      if (!token) return

      const response = await fetch(`${SUPPLIERS_SERVICE_URL}?page=0&size=100`, {
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
        setSuppliers(list as unknown as Supplier[])
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = getAccessToken()
      if (!token) {
        setError('Please login to create import request')
        return
      }

      const requestBody = {
        sparePartId: parseInt(formData.sparePartId),
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        requestedQuantity: parseInt(formData.requestedQuantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        requestReason: formData.requestReason,
        expectedDeliveryDate: formData.expectedDeliveryDate || null
      }

      const response = await fetch(`${SPARE_PARTS_SERVICE_URL}/warehouse/import-requests`, {
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
          supplierId: '',
          requestedQuantity: '',
          unitPrice: '',
          requestReason: '',
          expectedDeliveryDate: ''
        })
      } else {
        const errorData = await response.text()
        setError('Failed to create import request: ' + errorData)
      }
    } catch (err) {
      console.error('Error creating import request:', err)
      setError('Failed to create import request')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Spare Part Import Request</DialogTitle>
          <DialogDescription>
            Request spare parts to be imported into inventory
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
                <SelectValue placeholder="Select spare part" />
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

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={formData.supplierId} onValueChange={(value) => handleInputChange('supplierId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier (optional)" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.requestedQuantity}
                onChange={(e) => handleInputChange('requestedQuantity', e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price ($)</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedDelivery">Expected Delivery Date</Label>
            <Input
              id="expectedDelivery"
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Request Reason *</Label>
            <Textarea
              id="reason"
              value={formData.requestReason}
              onChange={(e) => handleInputChange('requestReason', e.target.value)}
              placeholder="Please explain why this import is needed..."
              required
              className="min-h-[80px]"
            />
          </div>

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
              disabled={loading || !formData.sparePartId || !formData.requestedQuantity || !formData.requestReason}
            >
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
