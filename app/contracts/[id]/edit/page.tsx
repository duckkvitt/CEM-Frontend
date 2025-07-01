'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { getContractDetails, updateContract, ContractResponse, UpdateContractRequest } from '@/lib/contract-service'
import { getCurrentUserRole } from '@/lib/auth'

interface Props {
  params: {
    id: string
  }
}

export default function EditContractPage({ params }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contract, setContract] = useState<ContractResponse | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<UpdateContractRequest>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    totalValue: 0,
    contractDetails: []
  })
  
  // Fetch contract details on mount
  useEffect(() => {
    async function fetchContract() {
      try {
        const contractId = parseInt(params.id)
        const data = await getContractDetails(contractId)
        
        // Check if contract is editable
        if (data.status !== 'UNSIGNED') {
          setError('Cannot edit a contract that has already been signed')
          setLoading(false)
          return
        }
        
        setContract(data)
        
        // Initialize form with contract data
        setFormData({
          title: data.title,
          description: data.description || '',
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
          totalValue: data.totalValue,
          contractDetails: data.contractDetails || []
        })
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching contract:', err)
        setError('Failed to load contract. Please try again.')
        setLoading(false)
      }
    }
    
    fetchContract()
    setUserRole(getCurrentUserRole())
  }, [params.id])
  
  // Handle form input changes
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle contract detail changes
  function handleDetailChange(index: number, field: string, value: string | number) {
    setFormData(prev => {
      const updatedDetails = [...prev.contractDetails!]
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value
      }
      
      // Update total price for the detail item
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' 
          ? Number(value) 
          : updatedDetails[index].quantity
          
        const unitPrice = field === 'unitPrice' 
          ? Number(value) 
          : updatedDetails[index].unitPrice
          
        updatedDetails[index].totalPrice = quantity * unitPrice
      }
      
      return { ...prev, contractDetails: updatedDetails }
    })
  }
  
  // Calculate total contract value from detail items
  function calculateTotalValue(): number {
    return formData.contractDetails?.reduce(
      (sum, detail) => sum + (detail.totalPrice || detail.quantity * detail.unitPrice), 
      0
    ) || 0
  }
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      if (!contract) {
        throw new Error('Contract not loaded')
      }
      
      // Update total value before submitting
      const totalValue = calculateTotalValue()
      
      await updateContract(contract.id, {
        ...formData,
        totalValue
      })
      
      // Navigate back to contract detail page
      router.push(`/contracts/${contract.id}`)
    } catch (err) {
      console.error('Error updating contract:', err)
      setError('Failed to update contract. Please try again.')
      setSaving(false)
    }
  }
  
  // Check if user has permission to edit
  const canEdit = userRole === 'MANAGER' || userRole === 'STAFF'
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading contract...</p>
        </div>
      </div>
    )
  }
  
  if (error || !contract || !canEdit) {
    return (
      <div className="rounded-md bg-red-50 p-6 text-center">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-red-700">
          {!canEdit
            ? 'You do not have permission to edit contracts'
            : error || 'Contract not found'}
        </p>
        <div className="mt-4">
          <Link 
            href={contract ? `/contracts/${contract.id}` : '/contracts'} 
            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            {contract ? 'Back to contract details' : 'Back to contracts'}
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/contracts/${contract.id}`}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold">Edit Contract</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        {/* Contract Basic Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Contract Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Contract Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                required
                placeholder="Contract title"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                placeholder="Contract description (optional)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Value:</span>
                <span className="font-semibold text-primary text-lg">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(calculateTotalValue())}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contract Details */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contract Items</h2>
          </div>
          
          <div className="space-y-4">
            {formData.contractDetails?.map((detail, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Item {index + 1}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Work Code</label>
                    <input
                      type="text"
                      value={detail.workCode}
                      onChange={(e) => handleDetailChange(index, 'workCode', e.target.value)}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Name</label>
                    <input
                      type="text"
                      value={detail.serviceName}
                      onChange={(e) => handleDetailChange(index, 'serviceName', e.target.value)}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={detail.description || ''}
                      onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      placeholder="Description (optional)"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value))}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit Price (VND)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={detail.unitPrice}
                      onChange={(e) => handleDetailChange(index, 'unitPrice', parseInt(e.target.value))}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Warranty (Months)</label>
                    <input
                      type="number"
                      min="0"
                      value={detail.warrantyMonths || 0}
                      onChange={(e) => handleDetailChange(index, 'warrantyMonths', parseInt(e.target.value))}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <input
                      type="text"
                      value={detail.notes || ''}
                      onChange={(e) => handleDetailChange(index, 'notes', e.target.value)}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between items-center">
          <Link
            href={`/contracts/${contract.id}`}
            className="px-4 py-2 border rounded-md hover:bg-muted/50"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
