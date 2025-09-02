'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Filter, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface FilterOptions {
  searchTerm: string
  stockStatus: string
  itemType: string
  location: string
  minStock: string
  maxStock: string
  minCost: string
  maxCost: string
  sortBy: string
  sortOrder: string
}

interface AdvancedFilterProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  availableLocations: string[]
  activeFiltersCount: number
}

export function AdvancedFilter({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  availableLocations,
  activeFiltersCount
}: AdvancedFilterProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleApply = () => {
    onApplyFilters()
    onClose()
  }

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      searchTerm: '',
      stockStatus: 'all',
      itemType: 'all',
      location: 'all',
      minStock: '',
      maxStock: '',
      minCost: '',
      maxCost: '',
      sortBy: 'name',
      sortOrder: 'asc'
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    onResetFilters()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (localFilters.searchTerm) count++
    if (localFilters.stockStatus !== 'all') count++
    if (localFilters.itemType !== 'all') count++
    if (localFilters.location !== 'all') count++
    if (localFilters.minStock || localFilters.maxStock) count++
    if (localFilters.minCost || localFilters.maxCost) count++
    if (localFilters.sortBy !== 'name' || localFilters.sortOrder !== 'asc') count++
    return count
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-6 w-6" />
                <div>
                  <CardTitle className="text-xl">Advanced Filters</CardTitle>
                  <p className="text-blue-100 text-sm mt-1">
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </p>
                </div>
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
          </CardHeader>
          
          <CardContent className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Search Term */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Term</Label>
                <Input
                  id="search"
                  placeholder="Search by name, model, serial..."
                  value={localFilters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>

              {/* Stock Status */}
              <div className="space-y-2">
                <Label>Stock Status</Label>
                <Select
                  value={localFilters.stockStatus}
                  onValueChange={(value) => handleFilterChange('stockStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Item Type */}
              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select
                  value={localFilters.itemType}
                  onValueChange={(value) => handleFilterChange('itemType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="device">Devices</SelectItem>
                    <SelectItem value="spare-part">Spare Parts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Warehouse Location</Label>
                <Select
                  value={localFilters.location}
                  onValueChange={(value) => handleFilterChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {availableLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock Range */}
              <div className="space-y-2">
                <Label>Stock Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minStock}
                    onChange={(e) => handleFilterChange('minStock', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxStock}
                    onChange={(e) => handleFilterChange('maxStock', e.target.value)}
                  />
                </div>
              </div>

              {/* Cost Range */}
              <div className="space-y-2">
                <Label>Cost Range (VND)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minCost}
                    onChange={(e) => handleFilterChange('minCost', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxCost}
                    onChange={(e) => handleFilterChange('maxCost', e.target.value)}
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={localFilters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                    <SelectItem value="cost">Unit Cost</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="created">Created Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select
                  value={localFilters.sortOrder}
                  onValueChange={(value) => handleFilterChange('sortOrder', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

