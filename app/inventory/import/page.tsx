'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Wrench, 
  Plus, 
  Upload,
  CheckCircle,
  AlertCircle,
  Building,
  Hash,
  MapPin,
  FileText,
  Truck,
  Minus,
  Save
} from 'lucide-react'
import { 
  getSuppliers,
  getSupplierDeviceTypes,
  importInventory,
  Supplier,
  SupplierDeviceType,
  ImportRequest,
  SparePart,
  getSupplierDevices,
  SimpleDevice
} from '@/lib/api/inventory'
import { isAuthenticated } from '@/lib/api/client'
import { getSupplierById as getSupplierDetail } from '@/lib/supplier-service'

interface Device {
  id: number
  name: string
  model: string
  serialNumber: string
}

interface ImportItem {
  itemId: number
  quantity: number
  notes: string
}

export default function ImportPage() {
  const router = useRouter()
  const [itemType, setItemType] = useState<'DEVICE' | 'SPARE_PART'>('DEVICE')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierDeviceTypes, setSupplierDeviceTypes] = useState<SupplierDeviceType[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null)
  const [supplierDevices, setSupplierDevices] = useState<SimpleDevice[]>([])
  const [deviceSupplierIds, setDeviceSupplierIds] = useState<number[]>([])
  const [deviceSuppliersLoaded, setDeviceSuppliersLoaded] = useState(false)
  const [supplierSpareParts, setSupplierSpareParts] = useState<SparePart[]>([])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [warehouseLocation, setWarehouseLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ImportItem[]>([{
    itemId: 0,
    quantity: 1,
    notes: ''
  }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Mock data for development
  const devices = [
    { id: 1, name: 'Network Switch 24-Port', model: 'NS-24P', serialNumber: 'NS001-24P-001' },
    { id: 2, name: 'Wireless Router', model: 'WR-AC1200', serialNumber: 'WR001-AC1200-001' },
    { id: 3, name: 'Security Camera', model: 'SC-4K', serialNumber: 'SC001-4K-001' },
    { id: 4, name: 'Network Attached Storage', model: 'NAS-2TB', serialNumber: 'NAS001-2TB-001' },
    { id: 5, name: 'Firewall Appliance', model: 'FW-1000', serialNumber: 'FW001-1000-001' }
  ]

  const spareParts: SparePart[] = [
    { id: 1, partName: 'Network Cable Cat6', partCode: 'CAT6-1M', description: 'High-quality Cat6 network cables' },
    { id: 2, partName: 'Power Supply Unit', partCode: 'PSU-500W', description: '500W power supply units' },
    { id: 3, partName: 'RAM Module', partCode: 'RAM-8GB', description: '8GB DDR4 RAM modules' },
    { id: 4, partName: 'SSD Drive', partCode: 'SSD-500GB', description: '500GB SATA SSD drives' },
    { id: 5, partName: 'Network Card', partCode: 'NIC-1G', description: '1Gbps network interface cards' }
  ]

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    
    loadSuppliers()
  }, [router])

  useEffect(() => {
    async function loadForSelection() {
      if (!selectedSupplier) {
        setSupplierDevices([])
        setSupplierSpareParts([])
        return
      }
      if (itemType === 'DEVICE') {
        const list = await getSupplierDevices(selectedSupplier)
        setSupplierDevices(list)
      } else {
        try {
          const detail = await getSupplierDetail(selectedSupplier)
          setSupplierSpareParts(detail.spareParts || [])
        } catch {
          setSupplierSpareParts([])
        }
      }
    }
    loadForSelection()
  }, [itemType, selectedSupplier])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      
      // Load suppliers and supplier device types in parallel
      const [suppliersData, supplierDeviceTypesData] = await Promise.all([
        getSuppliers(),
        getSupplierDeviceTypes()
      ])
      
      setSuppliers(suppliersData)
      setSupplierDeviceTypes(supplierDeviceTypesData)
      const ids: number[] = []
      for (const s of suppliersData) {
        try {
          const list = await getSupplierDevices(s.id)
          if (list && list.length > 0) ids.push(s.id)
        } catch {}
      }
      setDeviceSupplierIds(ids)
      setDeviceSuppliersLoaded(true)
      
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, {
      itemId: 0,
      quantity: 1,
      notes: ''
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof ImportItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const getAvailableItems = () => {
    if (!selectedSupplier) return []
    
    if (itemType === 'DEVICE') {
      // Use actual mapping from device service
      return supplierDevices.map(d => ({ id: d.id, name: d.name, model: d.model }))
    } else {
      // Use supplier spare parts list
      return (supplierSpareParts || []).map(sp => ({ id: sp.id, name: sp.partName, model: sp.partCode }))
    }
  }

  const getFilteredSuppliers = () => {
    if (itemType === 'DEVICE') {
      if (!deviceSuppliersLoaded) return suppliers
      return suppliers.filter(s => deviceSupplierIds.includes(s.id))
    }

    // Spare parts path: show all, but prefer ones that indicate suppliesSpareParts
    const anyFlag = suppliers.some(s => typeof s.suppliesSpareParts === 'boolean')
    if (anyFlag) return suppliers.filter(s => s.suppliesSpareParts !== false)
    return suppliers
  }

  const getSupplierInfo = () => {
    if (!selectedSupplier) return null
    return suppliers.find(s => s.id === selectedSupplier)
  }

  const getAvailableItemsCount = () => {
    const items = getAvailableItems()
    return items.length
  }

  const validateForm = (): boolean => {
    if (!selectedSupplier) {
      setError('Please select a supplier')
      return false
    }

    if (items.some(item => item.itemId === 0)) {
      setError('Please select an item for all entries')
      return false
    }

    if (items.some(item => item.quantity <= 0)) {
      setError('All quantities must be greater than 0')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const importRequest: ImportRequest = {
        itemType,
        supplierId: selectedSupplier!,
        referenceNumber: referenceNumber || undefined,
        warehouseLocation: warehouseLocation || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          // Send default values for backend compatibility
          unitPrice: undefined, // Not used in our system
          unitCost: undefined,  // Not used in our system
          minimumStockLevel: undefined, // Will use existing inventory values
          maximumStockLevel: undefined, // Will use existing inventory values
          reorderPoint: undefined,      // Will use existing inventory values
          notes: item.notes || undefined
        }))
      }

      const result = await importInventory(importRequest)
      
      setSuccess(`Successfully imported ${result.length} item${result.length !== 1 ? 's' : ''}`)
      
      // Reset form
      setItems([{
        itemId: 0,
        quantity: 1,
        notes: ''
      }])
      setSelectedSupplier(null)
      setReferenceNumber('')
      setWarehouseLocation('')
      setNotes('')
      
    } catch (err: any) {
      console.error('Import failed:', err)
      setError(err.message || 'Failed to import inventory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Inventory</h1>
        <p className="text-muted-foreground">
          Add new devices or spare parts to inventory
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Import Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              General Import Information
            </CardTitle>
            <CardDescription>
              Basic details about this import transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemType">Item Type *</Label>
                <Select value={itemType} onValueChange={(value: 'DEVICE' | 'SPARE_PART') => {
                  setItemType(value)
                  setSelectedSupplier(null) // Reset supplier when item type changes
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEVICE">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Devices
                      </div>
                    </SelectItem>
                    <SelectItem value="SPARE_PART">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Spare Parts
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select value={selectedSupplier?.toString() || ''} onValueChange={(value) => setSelectedSupplier(value ? parseInt(value) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredSuppliers().map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {supplier.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFilteredSuppliers().length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No suppliers available for {itemType === 'DEVICE' ? 'devices' : 'spare parts'}
                  </p>
                )}
                {selectedSupplier && (
                  <div className="text-sm text-muted-foreground">
                    <p>Selected: {getSupplierInfo()?.name}</p>
                    <p>Available {itemType === 'DEVICE' ? 'devices' : 'spare parts'}: {getAvailableItemsCount()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  placeholder="PO number, invoice number, etc."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseLocation">Warehouse Location</Label>
                <Input
                  id="warehouseLocation"
                  placeholder="e.g., A1-B2, Section 3"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this import..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Import Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Import Items</span>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
            <CardDescription>
              Specify the items to import with their quantities and notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      variant="outline"
                      size="sm"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`item-${index}`}>Item *</Label>
                    <Select
                      value={item.itemId.toString()}
                      onValueChange={(value) => updateItem(index, 'itemId', parseInt(value))}
                      disabled={!selectedSupplier}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSupplier ? "Select item" : "Select supplier first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableItems().map((availableItem) => (
                          <SelectItem key={availableItem.id} value={availableItem.id.toString()}>
                            {availableItem.name} - {availableItem.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedSupplier && (
                      <p className="text-sm text-muted-foreground">
                        Please select a supplier first to see available items
                      </p>
                    )}
                    {selectedSupplier && getAvailableItems().length === 0 && (
                      <p className="text-sm text-red-600">
                        No {itemType === 'DEVICE' ? 'devices' : 'spare parts'} available from this supplier
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`itemNotes-${index}`}>Item Notes</Label>
                  <Textarea
                    id={`itemNotes-${index}`}
                    placeholder="Notes specific to this item..."
                    value={item.notes || ''}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !selectedSupplier} className="min-w-[120px]">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Importing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Import Inventory
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
