'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { CustomerResponse } from '@/lib/customer-service'

interface FilterSectionProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedCustomer: number | undefined
  setSelectedCustomer: (customerId: number | undefined) => void
  customers: CustomerResponse[]
  customersLoading: boolean
  onSearch: (e: React.FormEvent) => void
  onClearFilters: () => void
}

export default function FilterSection({
  searchTerm,
  setSearchTerm,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  customersLoading,
  onSearch,
  onClearFilters
}: FilterSectionProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId ? parseInt(customerId) : undefined)
  }

  if (!isMounted) {
    return (
      <div className="mb-6 p-4 border rounded-md bg-muted/30">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded-md mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search contracts by title, contract number, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border rounded-md hover:bg-muted flex items-center gap-2"
        >
          <Filter size={16} />
          Filters
        </button>
      </form>

      {/* Filter Section */}
      {showFilters && (
        <div className="p-4 border rounded-md bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filters</h3>
            <button
              onClick={onClearFilters}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X size={14} />
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer</label>
              <select
                value={selectedCustomer || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Customers</option>
                {!customersLoading && Array.isArray(customers) && customers.length > 0 && customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
                {customersLoading && (
                  <option value="" disabled>Loading customers...</option>
                )}
                {!customersLoading && (!Array.isArray(customers) || customers.length === 0) && (
                  <option value="" disabled>No customers available</option>
                )}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 