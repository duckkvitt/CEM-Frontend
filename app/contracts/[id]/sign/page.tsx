'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { getContractDetails, signContract, ContractResponse, SignContractRequest } from '@/lib/contract-service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default function SignContractPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contract, setContract] = useState<ContractResponse | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<SignContractRequest>({
    signatureType: 'DIGITAL',
    signerName: '',
    signerEmail: '',
    notes: ''
  })
  
  // Fetch contract details on mount
  useEffect(() => {
    async function fetchContract() {
      try {
        const contractId = parseInt(resolvedParams.id)
        const data = await getContractDetails(contractId)
        
        // Check if contract is unsigned
        if (data.status !== 'UNSIGNED') {
          setError('This contract has already been signed')
          setLoading(false)
          return
        }
        
        setContract(data)
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
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSigning(true)
    setError(null)
    
    try {
      if (!contract) {
        throw new Error('Contract not loaded')
      }
      
      // Validate required fields
      if (!formData.signerName || !formData.signerEmail) {
        throw new Error('Signer name and email are required')
      }
      
      // Sign contract
      await signContract(contract.id, formData)
      
      // Navigate back to contract detail page
      router.push(`/contracts/${contract.id}`)
    } catch (err) {
      console.error('Error signing contract:', err)
      setError('Failed to sign contract. Please try again.')
      setSigning(false)
    }
  }
  
  // Check if user has permission to sign
  const canSign = userRole === 'MANAGER'
  
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
  
  if (error || !contract || !canSign) {
    return (
      <div className="rounded-md bg-red-50 p-6 text-center">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-red-700">
          {!canSign
            ? 'You do not have permission to sign contracts. Only managers can sign contracts.'
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
          <h1 className="text-2xl font-bold">Sign Contract</h1>
        </div>
      </div>
      
      {/* Contract summary */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">{contract.title}</h2>
        <p className="text-muted-foreground mb-4">{contract.description || 'No description'}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Contract Number</div>
            <div className="text-sm">{contract.contractNumber}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Customer</div>
            <div className="text-sm">{contract.customerName || `Customer #${contract.customerId}`}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Value</div>
            <div className="text-sm font-semibold">{formatCurrency(contract.totalValue)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Start Date</div>
            <div className="text-sm">{formatDate(contract.startDate)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">End Date</div>
            <div className="text-sm">{formatDate(contract.endDate)}</div>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            By signing this contract, you confirm that the customer has agreed to the terms and conditions.
            A notification email will be sent to the customer with their account credentials to access the system.
          </p>
        </div>
      </div>
      
      {/* Signature form */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Electronic Signature</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Error message */}
          {error && (
            <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Signature Type</label>
              <select
                name="signatureType"
                value={formData.signatureType}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                required
              >
                <option value="DIGITAL">Digital Signature</option>
                <option value="PAPER">Paper Signature</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {formData.signatureType === 'DIGITAL' 
                  ? 'Electronic signature that will be stored in the system' 
                  : 'Physical signature on paper that has been confirmed'}
              </p>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Signer Information</label>
              <p className="text-xs text-muted-foreground mb-2">
                Enter the customer's information who is signing this contract
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    name="signerName"
                    value={formData.signerName}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                    placeholder="Customer's full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Email Address</label>
                  <input
                    type="email"
                    name="signerEmail"
                    value={formData.signerEmail}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                    placeholder="Customer's email address"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    The customer will receive login credentials at this email
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-1">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                placeholder="Any additional notes or comments about the signature (optional)"
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-6 flex justify-between items-center">
            <Link
              href={`/contracts/${contract.id}`}
              className="px-4 py-2 border rounded-md hover:bg-muted/50"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-70"
              disabled={signing}
            >
              {signing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Sign Contract</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
