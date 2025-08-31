import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Search, Filter, Package, Hash, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { exportSparePartForTask } from '@/lib/task-service'
import { getSparePartsWithInventory } from '@/lib/api/inventory'
import { toast } from 'sonner'

interface SparePartsExportModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
  onExportSuccess: () => void
}

interface ExportItem {
  sparePartId: number
  partCode: string
  quantity: number
  notes: string
  unitCost: number
}

export function SparePartsExportModal({ 
  isOpen, 
  onClose, 
  taskId, 
  taskTitle, 
  onExportSuccess 
}: SparePartsExportModalProps) {
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [exportItems, setExportItems] = useState<ExportItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load spare parts on modal open
  useEffect(() => {
    if (isOpen) {
      loadSpareParts()
    }
  }, [isOpen])

  const loadSpareParts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSparePartsWithInventory()
      console.log('Spare parts data:', data) // Debug log
      if (data && data.length > 0) {
        console.log('First spare part:', data[0]) // Debug log
      }
      setSpareParts(data)
    } catch (err) {
      setError('Failed to load spare parts')
      console.error('Failed to load spare parts:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSpareParts = spareParts.filter(part => {
    const sparePartName = part.sparePartName || part.partName
    const partCode = part.partCode || part.sparePartModel
    const category = part.compatibleDevices || part.category
    
    const matchesSearch = sparePartName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partCode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToExportList = (sparePart: any) => {
    console.log('Adding spare part to export list:', sparePart) // Debug log
    
    // Sử dụng id thay vì sparePartId nếu sparePartId không tồn tại
    const sparePartId = sparePart.sparePartId || sparePart.id
    const partCode = sparePart.partCode || sparePart.sparePartModel
    const sparePartName = sparePart.sparePartName || sparePart.partName
    
    const existingItem = exportItems.find(item => item.sparePartId === sparePartId)
    
    if (existingItem) {
      setExportItems(prev => prev.map(item => 
        item.sparePartId === sparePartId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setExportItems(prev => [...prev, {
        sparePartId: sparePartId,
        partCode: partCode,
        quantity: 1,
        notes: '',
        unitCost: sparePart.unitCost || 0
      }])
    }
    
    toast.success(`${sparePartName} added to export list`)
  }

  const removeFromExportList = (sparePartId: number) => {
    setExportItems(prev => prev.filter(item => item.sparePartId !== sparePartId))
  }

  const updateExportItemQuantity = (sparePartId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromExportList(sparePartId)
      return
    }
    
    setExportItems(prev => prev.map(item => 
      item.sparePartId === sparePartId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const updateExportItemNotes = (sparePartId: number, notes: string) => {
    setExportItems(prev => prev.map(item => 
      item.sparePartId === sparePartId 
        ? { ...item, notes }
        : item
    ))
  }

  const getTotalExportCost = () => {
    return exportItems.reduce((total, item) => total + (item.unitCost * item.quantity), 0)
  }

  const handleExport = async () => {
    if (exportItems.length === 0) {
      toast.error('Please add at least one spare part to export')
      return
    }

    try {
      setExporting(true)
      
      // Export từng spare part một
      for (const item of exportItems) {
        const exportRequest = {
          taskId: taskId,
          sparePartId: item.sparePartId,
          quantity: item.quantity,
          notes: item.notes || `Exported for task: ${taskTitle}`,
          warehouseLocation: 'Main Warehouse'
        }
        
        await exportSparePartForTask(exportRequest)
      }
      
      toast.success('Spare parts exported successfully')
      onExportSuccess()
      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Failed to export spare parts. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const getAvailableCategories = () => {
    const categories = new Set<string>()
    spareParts.forEach(part => {
      const category = part.compatibleDevices || part.category
      if (category) {
        categories.add(category)
      }
    })
    return Array.from(categories).sort()
  }

  if (!isOpen) return null

  return (
        <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" 
      style={{ 
        pointerEvents: 'auto',
        isolation: 'isolate',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        // Không đóng modal khi click backdrop để giữ modal task detail
        e.stopPropagation()
        e.preventDefault()
      }}
    >
              <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden relative"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10000,
            margin: 'auto'
          }}
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Export Spare Parts</h2>
              <p className="text-blue-100 mt-1">Task: {taskTitle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div 
          className="flex h-[calc(80vh-120px)]" 
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            margin: '0 auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          {/* Left Panel - Available Spare Parts */}
          <div 
            className="flex-1 p-6 border-r border-gray-200 overflow-y-auto" 
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Spare Parts</h3>
              <p className="text-sm text-gray-600 mb-4">Search and select spare parts to export</p>
              
              {/* Search and Filter */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search spare parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All categories</SelectItem>
                    {getAvailableCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Spare Parts List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">{error}</p>
                <Button onClick={loadSpareParts} variant="outline">Retry</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSpareParts.map((part) => {
                  const sparePartId = part.sparePartId || part.id
                  const partCode = part.partCode || part.sparePartModel
                  const sparePartName = part.sparePartName || part.partName
                  const description = part.description || 'No description available'
                  const quantityInStock = part.quantityInStock || 0
                  
                  return (
                    <motion.div
                      key={sparePartId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{sparePartName}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {partCode}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {description}
                          </p>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>Stock: {quantityInStock}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => addToExportList(part)}
                          size="sm"
                          className="ml-4"
                          disabled={quantityInStock <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
                
                {filteredSpareParts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No spare parts found matching your criteria
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Export List */}
          <div 
            className="w-96 p-6 bg-gray-50 overflow-y-auto" 
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export List</h3>
              <p className="text-sm text-gray-600">Selected spare parts for export</p>
            </div>

            {exportItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No spare parts selected</p>
                <p className="text-sm">Select spare parts from the left panel</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exportItems.map((item) => {
                  const sparePart = spareParts.find(p => p.sparePartId === item.sparePartId)
                  return (
                    <Card key={item.sparePartId} className="bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {sparePart?.sparePartName || 'Unknown Part'}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromExportList(item.sparePartId)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">{item.partCode}</p>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Quantity Control */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`qty-${item.sparePartId}`} className="text-xs">Quantity:</Label>
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateExportItemQuantity(item.sparePartId, item.quantity - 1)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateExportItemQuantity(item.sparePartId, item.quantity + 1)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <Label htmlFor={`notes-${item.sparePartId}`} className="text-xs">Notes:</Label>
                          <Textarea
                            id={`notes-${item.sparePartId}`}
                            placeholder="Add notes..."
                            value={item.notes}
                            onChange={(e) => updateExportItemNotes(item.sparePartId, e.target.value)}
                            className="text-xs"
                            rows={2}
                          />
                        </div>

                        {/* Cost Info */}
                        <div className="text-xs text-gray-600">
                          <p>Unit Cost: ${item.unitCost}</p>
                          <p>Total: ${(item.unitCost * item.quantity).toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                <Separator />

                {/* Total Cost */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Total Export Cost:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${getTotalExportCost().toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {exportItems.length} item{exportItems.length !== 1 ? 's' : ''} selected
                  </p>
                </div>

                {/* Export Button */}
                <Button
                  onClick={handleExport}
                  disabled={exporting || exportItems.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {exporting ? 'Exporting...' : `Export ${exportItems.length} Item${exportItems.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
