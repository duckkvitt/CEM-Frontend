'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, FileText, Upload, X } from 'lucide-react'
import { getContractDetails, updateContract, ContractResponse, UpdateContractRequest } from '@/lib/contract-service'
import { getCurrentUserRole } from '@/lib/auth'
import { uploadContractFile as uploadContractFileApi } from '@/lib/contract-service'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default function EditContractPage({ params }: Props) {
  const resolvedParams = use(params)
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
  
  // File upload state
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  // const [uploadingFile, setUploadingFile] = useState(false)
  
  // Fetch contract details on mount
  useEffect(() => {
    async function fetchContract() {
      try {
        const contractId = parseInt(resolvedParams.id)
        const data = await getContractDetails(contractId)
        
        // Check if contract is editable
        if (data.status !== 'DRAFT') {
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
  }, [resolvedParams.id])
  
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
          
        // totalPrice is derived; use a temporary property in state via type assertion
        ;(updatedDetails[index] as any).totalPrice = quantity * unitPrice
      }
      
      return { ...prev, contractDetails: updatedDetails }
    })
  }
  
  // Calculate total contract value from detail items
  function calculateTotalValue(): number {
    return formData.contractDetails?.reduce(
      (sum, detail) => sum + (((detail as any).totalPrice) || detail.quantity * detail.unitPrice), 
      0
    ) || 0
  }
  
  // Handle file change
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    setFileError(null)
    if (!files || files.length === 0) {
      setContractFile(null)
      return
    }
    const file = files[0]
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed')
      setContractFile(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB')
      setContractFile(null)
      return
    }
    setContractFile(file)
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
      
      // Upload new file if selected
      let newFilePath: string | undefined = undefined
      if (contractFile) {
        newFilePath = await uploadContractFile() || undefined
      }

      await updateContract(contract.id, {
        ...formData,
        totalValue,
        ...(newFilePath ? { filePath: newFilePath } : {})
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
  
  async function uploadContractFile(): Promise<string | null> {
    if (!contractFile || !contract) return null
    // setUploadingFile(true)
    try {
      const result = await uploadContractFileApi(contractFile, contract.contractNumber)
      return result
    } catch (err) {
      console.error('Upload error', err)
      const message = err instanceof Error ? err.message : 'Failed to upload file'
      setFileError(message)
      throw new Error(message)
    } finally {
      // setUploadingFile(false)
    }
  }
  
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
            
            {/* File upload */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Contract Document (PDF)</label>
              <div className="border-2 border-dashed rounded-md p-4">
                {contractFile ? (
                  <div className="flex items-center gap-2 w-full">
                    <FileText size={24} className="text-primary" />
                    <div className="flex-1 truncate">
                      <p className="font-medium">{contractFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContractFile(null)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Click to upload new PDF</p>
                    <p className="text-xs text-gray-400">PDF (max 5MB)</p>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {fileError && (
                <p className="text-sm text-red-500 mt-1">{fileError}</p>
              )}
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
                  
                  {/* Optional display name not in backend type; use workCode/description instead */}
                  
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
