'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, ArrowLeft, Download, Trash2, RefreshCw, Check } from 'lucide-react'
import { getContractDetails, hideContract, ContractResponse, getContractFileUrl } from '@/lib/contract-service'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth'

interface Props {
  params: {
    id: string
  }
}

export default function ContractDetailPage({ params }: Props) {
  const router = useRouter()
  const [contract, setContract] = useState<ContractResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Fetch contract details
  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true)
        const data = await getContractDetails(parseInt(params.id))
        setContract(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching contract:', err)
        setError('Failed to load contract details')
        setLoading(false)
      }
    }

    fetchContract()
    setUserRole(getCurrentUserRole())
  }, [params.id])

  // Handle hide contract
  async function handleHideContract() {
    if (contract && window.confirm('Are you sure you want to hide this contract?')) {
      try {
        await hideContract(contract.id)
        router.push('/contracts')
      } catch (err) {
        console.error('Error hiding contract:', err)
        setError('Failed to hide contract')
      }
    }
  }

  // Handle download file
  function handleDownloadFile() {
    if (contract?.filePath) {
      window.open(getContractFileUrl(contract.filePath), '_blank')
    }
  }

  // Check if user is Manager
  const isManager = userRole === 'MANAGER'

  // Determine if user can edit based on role and contract status
  const canEdit = (userRole === 'MANAGER' || userRole === 'STAFF') && 
                 contract && 
                 contract.status === 'UNSIGNED'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading contract details...</p>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="rounded-md bg-red-50 p-6 text-center">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-red-700">{error || 'Contract not found'}</p>
        <div className="mt-4">
          <Link 
            href="/contracts" 
            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to contracts
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
            href="/contracts"
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold">Contract Details</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions based on contract status and user role */}
          {contract.status === 'UNSIGNED' && canEdit && (
            <Link
              href={`/contracts/${contract.id}/edit`}
              className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
            >
              <Edit size={16} />
              Edit
            </Link>
          )}

          {contract.status === 'UNSIGNED' && isManager && (
            <Link
              href={`/contracts/${contract.id}/sign`}
              className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Check size={16} />
              Sign Contract
            </Link>
          )}

          {contract.filePath && (
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Download size={16} />
              Download
            </button>
          )}

          {isManager && (
            <button
              onClick={handleHideContract}
              className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 size={16} />
              Hide
            </button>
          )}
        </div>
      </div>

      {/* Contract Summary Card */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 pb-4 border-b">
            <h2 className="text-lg font-semibold">{contract.title}</h2>
            <div className="mt-2 text-sm text-muted-foreground">{contract.description || 'No description'}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Contract Number</div>
              <div className="mt-1 font-medium">{contract.contractNumber}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  contract.status === 'UNSIGNED' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : contract.status === 'DIGITALLY_SIGNED' || contract.status === 'PAPER_SIGNED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {contract.status === 'UNSIGNED' 
                    ? 'Chưa ký' 
                    : contract.status === 'DIGITALLY_SIGNED' 
                      ? 'Đã ký điện tử' 
                      : contract.status === 'PAPER_SIGNED' 
                        ? 'Đã ký giấy' 
                        : 'Đã hủy'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Customer</div>
              <div className="mt-1">{contract.customerName || `Customer #${contract.customerId}`}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Staff</div>
              <div className="mt-1">{contract.staffName || `Staff #${contract.staffId}`}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="mt-1">{formatDateTime(contract.createdAt)}</div>
            </div>

            {contract.signedAt && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Signed</div>
                <div className="mt-1">{formatDateTime(contract.signedAt)}</div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground">Period</div>
              <div className="mt-1">
                {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Value</div>
              <div className="mt-1 text-lg font-semibold text-primary">
                {formatCurrency(contract.totalValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Contract Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Signed Status</div>
                <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold ${
                  contract.status === 'UNSIGNED'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {contract.status === 'UNSIGNED' ? 'Pending' : 'Signed'}
                </span>
              </div>
            </div>

            {contract.status !== 'UNSIGNED' && (
              <div>
                <div className="text-sm font-medium">Signed By</div>
                <div className="mt-1 text-sm">{contract.signedBy || 'Unknown'}</div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium">Digital Signature</div>
              <div className="mt-1">
                <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold ${
                  contract.digitalSigned
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {contract.digitalSigned ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Physical Copy</div>
              <div className="mt-1">
                <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold ${
                  contract.paperConfirmed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {contract.paperConfirmed ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">File Attachment</div>
              <div className="mt-1">
                {contract.filePath ? (
                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Download size={14} /> Download
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground">No file attached</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Details Section */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold">Contract Items</h3>

        {(!contract.contractDetails || contract.contractDetails.length === 0) ? (
          <div className="p-4 text-center text-muted-foreground">No contract items found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Work Code</th>
                  <th className="py-3 px-4">Service/Item</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contract.contractDetails.map((detail) => (
                  <tr key={detail.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{detail.workCode}</td>
                    <td className="py-3 px-4">{detail.serviceName}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {detail.description || 'No description'}
                    </td>
                    <td className="py-3 px-4">{detail.quantity}</td>
                    <td className="py-3 px-4">{formatCurrency(detail.unitPrice)}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(detail.totalPrice)}</td>
                    <td className="py-3 px-4">
                      {detail.warrantyMonths 
                        ? `${detail.warrantyMonths} month${detail.warrantyMonths > 1 ? 's' : ''}` 
                        : 'None'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/10 font-medium">
                  <td colSpan={5} className="py-3 px-4 text-right">Total:</td>
                  <td className="py-3 px-4 text-primary">{formatCurrency(contract.totalValue)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature History */}
      {contract.signatures && contract.signatures.length > 0 && (
        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Signature History</h3>

          <div className="divide-y">
            {contract.signatures.map((signature) => (
              <div key={signature.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{signature.signerName}</div>
                    <div className="text-sm text-muted-foreground">{signature.signerEmail}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {signature.signatureType === 'DIGITAL' 
                        ? 'Digital Signature' 
                        : signature.signatureType === 'PAPER' 
                          ? 'Paper Signature' 
                          : 'Digital Image'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(signature.createdAt)}
                    </div>
                  </div>
                </div>
                {signature.notes && (
                  <div className="mt-2 rounded bg-muted/50 p-3 text-sm">
                    {signature.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/50"
        >
          <ArrowLeft size={16} />
          Back to Contracts
        </Link>
      </div>
    </div>
  )
}
