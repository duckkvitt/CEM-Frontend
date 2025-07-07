'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Filter, Eye, Edit, Trash2, Check, RefreshCw } from 'lucide-react'
import { 
  getUnsignedContracts, 
  getSignedContracts, 
  getHiddenContracts,
  hideContract,
  restoreContract,
  ContractResponse,
  getContractsForCurrentUser // Using a new service function
} from '@/lib/contract-service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCurrentUserRole, getAccessToken } from '@/lib/auth'
import { CreateContractModal } from '@/app/contracts/components/create-contract-modal'

export default function ContractsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'unsigned' | 'signed' | 'hidden'>('unsigned')
  const [contracts, setContracts] = useState<ContractResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Check auth on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Set user role
    setUserRole(getCurrentUserRole());
    
    // Check if user has permission to access contract management
    const role = getCurrentUserRole();
    const contractRoles = ['MANAGER', 'STAFF', 'SUPPORT_TEAM'];
    
    if (!role || !contractRoles.includes(role)) {
      router.push('/dashboard');
      return;
    }
  }, [router]);
  
  // Load contracts based on active tab
  useEffect(() => {
    const fetchContracts = async () => {
      if (!getAccessToken()) {
        router.push('/login');
        return;
      }
      
      setLoading(true)
      setError(null)
      
      try {
        // For role-based access, get all contracts for the user
        // and filter them based on the active tab
        const allContracts = await getContractsForCurrentUser()
        
        let filteredContracts = []
        
        switch (activeTab) {
          case 'unsigned':
            filteredContracts = allContracts.filter(contract => 
              !contract.isHidden && (
                contract.status === 'DRAFT' ||
                contract.status === 'PENDING_SELLER_SIGNATURE' || 
                contract.status === 'PENDING_CUSTOMER_SIGNATURE'
              )
            )
            break
          case 'signed':
            filteredContracts = allContracts.filter(contract => 
              !contract.isHidden && contract.status === 'ACTIVE'
            )
            break
          case 'hidden':
            filteredContracts = allContracts.filter(contract => contract.isHidden === true)
            break
          default:
            filteredContracts = allContracts
        }
        
        setContracts(filteredContracts || [])
        setTotalPages(1) // Since we're not paginating on frontend
        setTotalElements(filteredContracts.length)
      } catch (err) {
        console.error('Error fetching contracts:', err)
        if (err instanceof Error && err.message.includes('401')) {
          // Unauthorized, redirect to login
          router.push('/login')
          return
        }
        setError('Failed to load contracts. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchContracts()
  }, [activeTab, page, router])

  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
  }, [])
  
  // Handle hide contract
  const handleHide = async (contractId: number) => {
    if (window.confirm('Are you sure you want to hide this contract?')) {
      try {
        await hideContract(contractId)
        // Refresh contracts by re-fetching all contracts and filtering based on current tab
        const allContracts = await getContractsForCurrentUser()
        
        let filteredContracts = []
        switch (activeTab) {
          case 'unsigned':
            filteredContracts = allContracts.filter(contract => 
              !contract.isHidden && (
                contract.status === 'DRAFT' ||
                contract.status === 'PENDING_SELLER_SIGNATURE' || 
                contract.status === 'PENDING_CUSTOMER_SIGNATURE'
              )
            )
            break
          case 'signed':
            filteredContracts = allContracts.filter(contract => 
              !contract.isHidden && contract.status === 'ACTIVE'
            )
            break
          case 'hidden':
            filteredContracts = allContracts.filter(contract => contract.isHidden === true)
            break
          default:
            filteredContracts = allContracts
        }
        
        setContracts(filteredContracts)
        setTotalElements(filteredContracts.length)
      } catch (err) {
        console.error('Error hiding contract:', err)
        setError('Failed to hide contract. Please try again.')
      }
    }
  }
  
  // Handle restore contract
  const handleRestore = async (contractId: number) => {
    try {
      await restoreContract(contractId)
      // Refresh contracts by re-fetching all contracts and filtering based on current tab
      const allContracts = await getContractsForCurrentUser()
      
      let filteredContracts = []
      switch (activeTab) {
        case 'unsigned':
          filteredContracts = allContracts.filter(contract => 
            !contract.isHidden && (
              contract.status === 'DRAFT' ||
              contract.status === 'PENDING_SELLER_SIGNATURE' || 
              contract.status === 'PENDING_CUSTOMER_SIGNATURE'
            )
          )
          break
        case 'signed':
          filteredContracts = allContracts.filter(contract => 
            !contract.isHidden && contract.status === 'ACTIVE'
          )
          break
        case 'hidden':
          filteredContracts = allContracts.filter(contract => contract.isHidden === true)
          break
        default:
          filteredContracts = allContracts
      }
      
      setContracts(filteredContracts)
      setTotalElements(filteredContracts.length)
    } catch (err) {
      console.error('Error restoring contract:', err)
      setError('Failed to restore contract. Please try again.')
    }
  }

  // Check if user is Manager
  const isManager = userRole === 'MANAGER'

  // Determine if user can edit based on role
  const canEdit = userRole === 'MANAGER' || userRole === 'STAFF'
  
  const isPrivilegedUser = userRole === 'MANAGER' || userRole === 'STAFF';

  // Show loading until we verify authentication
  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  function handleSuccess() {
    setIsCreateModalOpen(false)
    // Add logic to refetch contract list
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contract Management</h1>
        {isPrivilegedUser && (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={16} /> Create Contract
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex -mb-px">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'unsigned'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('unsigned')}
          >
            Unsigned Contracts
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'signed'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('signed')}
          >
            Signed Contracts
          </button>
          {isManager && (
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'hidden'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('hidden')}
            >
              Hidden Contracts
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* Contracts table */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full bg-white text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Contract Number</th>
              <th className="py-3 px-4 text-left font-medium">Title</th>
              <th className="py-3 px-4 text-left font-medium">Customer</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-left font-medium">Value</th>
              <th className="py-3 px-4 text-left font-medium">Created</th>
              <th className="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {activeTab === 'unsigned' 
                    ? 'No unsigned contracts found.' 
                    : activeTab === 'signed' 
                      ? 'No signed contracts found.' 
                      : 'No hidden contracts found.'}
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{contract.contractNumber}</td>
                  <td className="py-3 px-4 max-w-xs truncate">{contract.title}</td>
                  <td className="py-3 px-4">{contract.customerName || `Customer #${contract.customerId}`}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      contract.status === 'DRAFT' || contract.status === 'PENDING_SELLER_SIGNATURE' || contract.status === 'PENDING_CUSTOMER_SIGNATURE' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : contract.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800' 
                          : contract.status === 'REJECTED' || contract.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : contract.status === 'EXPIRED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-800'
                    }`}>
                      {contract.status === 'DRAFT'
                        ? 'Bản nháp'
                        : contract.status === 'PENDING_SELLER_SIGNATURE' 
                          ? 'Chờ bên bán ký' 
                          : contract.status === 'PENDING_CUSTOMER_SIGNATURE'
                            ? 'Chờ khách hàng ký'
                            : contract.status === 'ACTIVE'
                              ? 'Đã ký, có hiệu lực'
                              : contract.status === 'REJECTED'
                                ? 'Đã từ chối'
                                : contract.status === 'CANCELLED'
                                  ? 'Đã hủy'
                                  : contract.status === 'EXPIRED'
                                    ? 'Đã hết hạn'
                                    : contract.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{formatCurrency(contract.totalValue)}</td>
                  <td className="py-3 px-4">{formatDate(contract.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {/* View button always available */}
                      <button
                        onClick={() => router.push(`/contracts/${contract.id}`)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      
                                {/* Edit button only for draft contracts and staff/managers */}
          {contract.status === 'DRAFT' && canEdit && (
                        <button
                          onClick={() => router.push(`/contracts/${contract.id}/edit`)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Edit contract"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      
                                {/* Sign button only for contracts pending signature and managers */}
          {(contract.status === 'PENDING_SELLER_SIGNATURE' || contract.status === 'PENDING_CUSTOMER_SIGNATURE') && isManager && (
                        <button
                          onClick={() => router.push(`/contracts/${contract.id}/sign`)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Sign contract"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      
                      {/* Hide button only for visible contracts and managers */}
                      {activeTab !== 'hidden' && isManager && (
                        <button
                          onClick={() => handleHide(contract.id)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Hide contract"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      
                      {/* Restore button only for hidden contracts and managers */}
                      {activeTab === 'hidden' && isManager && (
                        <button
                          onClick={() => handleRestore(contract.id)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Restore contract"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {page * 10 + 1} to {Math.min((page + 1) * 10, totalElements)} of {totalElements} contracts
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Create Contract Modal */}
      <CreateContractModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
} 