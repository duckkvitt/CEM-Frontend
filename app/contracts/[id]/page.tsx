'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, ArrowLeft, Download, Trash2, Check } from 'lucide-react'
import { getContractDetails, hideContract, ContractResponse, getSignedDownloadUrl, submitSignature, SignatureRequest, getContractFileBlob } from '@/lib/contract-service'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth'
import dynamic from 'next/dynamic';

// Dynamic import for PdfViewer to avoid SSR issues
const PdfViewer = dynamic(
  () => import('@/components/pdf-viewer').then((mod) => ({ default: mod.PdfViewer })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[75vh] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    )
  }
);
import { SignatureModal } from '@/components/signature-modal';
import { toast } from "sonner";

interface Props {
  params: Promise<{
    id: string
  }>
}

export default function ContractDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [contract, setContract] = useState<ContractResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Fetch contract details
  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true)
        const data = await getContractDetails(parseInt(resolvedParams.id))
        console.log('Contract data loaded:', data)
        console.log('Contract filePath:', data.filePath)
        console.log('Contract status:', data.status)
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
  }, [resolvedParams.id])

  // Fetch PDF blob when contract is loaded and has filePath
  useEffect(() => {
    let blobUrl: string | null = null;

    async function fetchPdfBlob() {
      if (contract && contract.filePath) {
        try {
          setPdfLoading(true);
          setPdfError(null);
          blobUrl = await getContractFileBlob(contract.id);
          setPdfBlobUrl(blobUrl);
        } catch (err) {
          console.error('Error fetching PDF:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while loading PDF';
          setPdfError(`Failed to load contract file: ${errorMessage}`);
        } finally {
          setPdfLoading(false);
        }
      } else {
        if (contract && !contract.filePath) {
          setPdfError('Contract file not available. The PDF may not have been generated yet.');
        }
      }
    }

    fetchPdfBlob();

    // Cleanup function
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [contract]); // Dependency is now only 'contract' object


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
  const handleDownloadFile = async (fileName: string) => {
    try {
      const downloadUrl = getSignedDownloadUrl(fileName);
      // Open download URL in new tab - it will redirect to Cloudinary
      window.open(await downloadUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleSignContract = async (signatureImage: string) => {
    if (!contract) return;

    setIsSigning(true);
    try {
      const signerType = (userRole === 'MANAGER' || userRole === 'STAFF') ? 'SELLER' : 'CUSTOMER';
      const request: SignatureRequest = { signatureImage, signerType };
      
      await submitSignature(contract.id, request);

      toast.success("Signature submitted successfully.");
      setSignatureModalOpen(false);
      // Optionally, refetch contract data to show updated status
      // fetchContract();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit signature.";
      toast.error(errorMessage);
    } finally {
      setIsSigning(false);
    }
  };
  
  // Determine if the current user can sign
  const canSign = userRole && contract && (
    (userRole === 'MANAGER' && contract.status === 'PENDING_SELLER_SIGNATURE') ||
    (userRole === 'STAFF' && contract.status === 'PENDING_SELLER_SIGNATURE') ||
    (userRole === 'CUSTOMER' && contract.status === 'PENDING_CUSTOMER_SIGNATURE')
  );

  // Check if user is Manager
  const isManager = userRole === 'MANAGER'

  // Determine if user can edit based on role and contract status
  const canEdit = (userRole === 'MANAGER' || userRole === 'STAFF') && 
                 contract && 
                 contract.status === 'DRAFT'

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
      {/* Header with actions */}
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
          {contract.status === 'DRAFT' && canEdit && (
            <Link
              href={`/contracts/${contract.id}/edit`}
              className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
            >
              <Edit size={16} />
              Edit
            </Link>
          )}

          {canSign && (
            <button
              onClick={() => setSignatureModalOpen(true)}
              className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Check size={16} />
              Sign Contract
            </button>
          )}

          {contract.filePath && (
            <button
              onClick={() => handleDownloadFile(contract.filePath)}
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

      {/* Contract Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Summary Card */}
        <div className="lg:col-span-1 order-last lg:order-first">
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

        {/* PDF Viewer */}
        <div className="lg:col-span-2 order-first lg:order-last">
          <div className="rounded-lg border bg-white p-2 shadow-sm">
            {contract.filePath ? (
              pdfLoading ? (
                <div className="flex items-center justify-center h-[75vh] bg-gray-50 rounded-md">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading contract file...</p>
                  </div>
                </div>
              ) : pdfBlobUrl ? (
                <PdfViewer fileUrl={pdfBlobUrl} />
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center h-[75vh] bg-red-50 rounded-md border border-red-200">
                  <div className="text-center max-w-md">
                    <div className="text-red-600 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-800 mb-2">Contract File Error</h3>
                    <p className="text-sm text-red-700 mb-4">{pdfError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Retry Loading
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[75vh] bg-gray-50 rounded-md">
                  <p className="text-muted-foreground">Failed to load contract file.</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-[75vh] bg-yellow-50 rounded-md border border-yellow-200">
                <div className="text-center max-w-md">
                  <div className="text-yellow-600 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">No Contract File</h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    The PDF contract file has not been generated yet.
                  </p>
                  <p className="text-xs text-yellow-600">
                    This usually happens when there was an error during contract creation. Please contact your administrator.
                  </p>
                </div>
              </div>
            )}
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

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSign={handleSignContract}
        loading={isSigning}
      />
    </div>
  )
}

