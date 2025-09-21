'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, ArrowLeft, Download, Check, ShieldCheck, Loader2, X, FileText, Calendar, User, DollarSign, Clock, AlertCircle, CheckCircle2, FileSignature, Eye, RefreshCw, Sparkles, Zap, Star, Award, TrendingUp, Hash } from 'lucide-react'
import { getContractDetails, ContractResponse, getSignedDownloadUrl, submitSignature, SignatureRequest, getContractFileBlob, submitDigitalSignature, getContractSignatures, verifySignature, type DigitalSignatureRequest, type DigitalSignatureRecord, type SignatureVerificationResult } from '@/lib/contract-service'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { getCurrentUserRole } from '@/lib/auth'
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

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
  const [signatures, setSignatures] = useState<DigitalSignatureRecord[]>([])
  const [verificationResults, setVerificationResults] = useState<Map<number, SignatureVerificationResult>>(new Map())
  const [loadingVerification, setLoadingVerification] = useState<Set<number>>(new Set())

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
          // Add timestamp to force refresh PDF after signatures
          const timestamp = Date.now();
          blobUrl = await getContractFileBlob(contract.id, timestamp);
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
  }, [contract]);



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
      // Determine signer type based on user role
      let signerType = 'STAFF'; // Default
      if (userRole === 'MANAGER') {
        signerType = 'MANAGER';
      } else if (userRole === 'CUSTOMER') {
        signerType = 'CUSTOMER';
      }

      // Create comprehensive digital signature request
      const digitalSignatureRequest: DigitalSignatureRequest = {
        signerType: signerType,
        signerName: `${signerType} User`, // You can update this with actual user name
        signerEmail: `${signerType.toLowerCase()}@cemcontract.com`, // You can update this with actual email
        signatureData: signatureImage, // Base64 encoded PNG from canvas
        reason: "Digital contract signature",
        location: "CEM Digital Platform",
        contactInfo: "CEM Contract Management System",
        // Position signature in bottom-right area for visibility
        signatureX: 350,
        signatureY: 50,
        signatureWidth: 200,
        signatureHeight: 100,
        pageNumber: 1,
        includeTimestamp: true,
        // Add browser and client information
        ipAddress: "127.0.0.1", // Would typically get from server
        userAgent: navigator.userAgent
      };
      
      console.log("Submitting digital signature with data:", digitalSignatureRequest);
      
      const signatureRecord = await submitDigitalSignature(contract.id, digitalSignatureRequest);

      toast.success("Digital signature submitted successfully! The signature should now be visible in the PDF.");
      setSignatureModalOpen(false);
      
      // Clear old PDF blob to force refresh
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      
      // Refetch contract data and signatures
      const [updatedContract, contractSignatures] = await Promise.all([
        getContractDetails(parseInt(resolvedParams.id)),
        getContractSignatures(contract.id)
      ]);
      
      setContract(updatedContract);
      setSignatures(contractSignatures);
      
      // Force PDF reload after a short delay to ensure contract state is updated
      setTimeout(() => {
        setPdfLoading(true);
      }, 100);
      
    } catch (err: unknown) {
      console.error("Digital signature failed:", err);
      
      // Better error handling
      if (err instanceof Error) {
        toast.error(`Digital signature failed: ${err.message}`);
      } else {
        toast.error("Digital signature failed with unknown error");
      }
      
      // Optional: Still try legacy signature as fallback
      try {
        console.log("Attempting legacy signature fallback...");
        const legacyRequest: SignatureRequest = { signature: signatureImage };
        await submitSignature(contract.id, legacyRequest);
        
        toast.success("Signature submitted successfully (legacy mode). Note: Signature may not be visible in PDF.");
        setSignatureModalOpen(false);
        
        // Refetch contract data
        const data = await getContractDetails(parseInt(resolvedParams.id));
        setContract(data);
        
      } catch (legacyErr: unknown) {
        const errorMessage = legacyErr instanceof Error ? legacyErr.message : "Failed to submit signature.";
        toast.error(`All signature methods failed: ${errorMessage}`);
      }
    } finally {
      setIsSigning(false);
    }
  };

  // Load signatures when contract loads
  useEffect(() => {
    if (contract?.id) {
      loadContractSignatures();
    }
  }, [contract?.id]);

  const loadContractSignatures = async () => {
    if (!contract) return;
    
    try {
      const contractSignatures = await getContractSignatures(contract.id);
      setSignatures(contractSignatures);
    } catch (error) {
      console.error("Failed to load contract signatures:", error);
    }
  };

  const handleVerifySignature = async (signatureId: number) => {
    setLoadingVerification(prev => new Set(prev).add(signatureId));
    
    try {
      const result = await verifySignature(signatureId);
      setVerificationResults(prev => new Map(prev).set(signatureId, result));
      
      if (result.signatureValid && result.certificateValid && result.documentIntegrityValid) {
        toast.success("Signature verification successful - cryptographic integrity confirmed!");
      } else {
        toast.error(`Signature verification failed: ${result.errorMessage || "Invalid signature"}`);
      }
    } catch (error) {
      console.error("Signature verification failed:", error);
      toast.error("Failed to verify signature");
    } finally {
      setLoadingVerification(prev => {
        const newSet = new Set(prev);
        newSet.delete(signatureId);
        return newSet;
      });
    }
  };
  
  // Determine if the current user can sign
  const canSign = userRole && contract && (
    (userRole === 'MANAGER' && contract.status === 'PENDING_SELLER_SIGNATURE') ||
    (userRole === 'CUSTOMER' && contract.status === 'PENDING_CUSTOMER_SIGNATURE')
  );

  // Check if user is Manager
  const isManager = userRole === 'MANAGER';
  const isStaff = userRole === 'STAFF';
  const isCustomer = userRole === 'CUSTOMER';

  // Determine if user can edit based on role and contract status
  const canEdit = (isManager || isStaff) && contract && contract.status === 'DRAFT';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-primary/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-700">Loading Contract Details</h3>
            <p className="text-slate-500">Please wait while we fetch your contract information...</p>
          </div>
          <div className="w-64 mx-auto">
            <Progress value={66} className="h-2" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">Contract Not Found</CardTitle>
            <CardDescription className="text-red-600">
              {error || 'The contract you are looking for could not be found or has been removed.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full">
              <Link href="/contracts">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contracts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/contracts"
              className="group flex items-center gap-2 text-white/90 hover:text-white transition-all duration-300"
            >
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium">Back to Contracts</span>
            </Link>

            <div className="flex items-center gap-3">
              {contract.status === 'DRAFT' && canEdit && (
                <Button asChild variant="secondary" size="sm" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                  <Link href={`/contracts/${contract.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}

              {canSign && (
                <Button
                  onClick={() => setSignatureModalOpen(true)}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  Sign Contract
                </Button>
              )}

              {contract.filePath && (
                <Button
                  onClick={() => contract.filePath && handleDownloadFile(contract.filePath)}
                  size="sm"
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <FileText className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Contract #{contract.contractNumber}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              {contract.title}
            </h1>
            
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              {contract.description || 'Professional contract management and digital signature solution'}
            </p>

            <div className="flex justify-center">
              <Badge 
                variant="secondary" 
                className={`px-4 py-2 text-sm font-semibold ${
                  contract.status === 'DRAFT' || contract.status === 'PENDING_SELLER_SIGNATURE' || contract.status === 'PENDING_CUSTOMER_SIGNATURE' 
                    ? 'bg-yellow-500/20 text-yellow-100 border-yellow-400/30' 
                    : contract.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-100 border-green-400/30' 
                      : contract.status === 'REJECTED' || contract.status === 'CANCELLED'
                        ? 'bg-red-500/20 text-red-100 border-red-400/30'
                        : contract.status === 'EXPIRED'
                          ? 'bg-gray-500/20 text-gray-100 border-gray-400/30'
                          : 'bg-gray-500/20 text-gray-100 border-gray-400/30'
                }`}
              >
                {contract.status === 'DRAFT'
                  ? 'Draft'
                  : contract.status === 'PENDING_SELLER_SIGNATURE' 
                    ? 'Pending Seller Signature' 
                    : contract.status === 'PENDING_CUSTOMER_SIGNATURE'
                      ? 'Pending Customer Signature'
                      : contract.status === 'ACTIVE'
                        ? 'Active & Signed'
                        : contract.status === 'REJECTED'
                          ? 'Rejected'
                          : contract.status === 'CANCELLED'
                            ? 'Cancelled'
                            : contract.status === 'EXPIRED'
                              ? 'Expired'
                              : contract.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Summary Cards */}
          <div className="xl:col-span-1 space-y-4">
            {/* Contract Overview */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-lg">Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Contract #</span>
                  <span className="text-sm font-semibold">{contract.contractNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Customer</span>
                  <span className="text-sm font-semibold">#{contract.customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Staff</span>
                  <span className="text-sm font-semibold">#{contract.staffId}</span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-lg">Financial</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-800">
                    {formatCurrency(contract.totalValue)}
                  </div>
                  <div className="text-xs text-green-600">Total Value</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Start</span>
                    <span className="font-medium">{formatDate(contract.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">End</span>
                    <span className="font-medium">{formatDate(contract.endDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <div className="text-slate-600">Created</div>
                  <div className="font-medium">{formatDateTime(contract.createdAt)}</div>
                </div>
                <div className="text-sm">
                  <div className="text-slate-600">Status</div>
                  <div className="font-medium">
                    {contract.status === 'DRAFT' ? 'Draft' :
                     contract.status === 'PENDING_SELLER_SIGNATURE' ? 'Pending Seller' :
                     contract.status === 'PENDING_CUSTOMER_SIGNATURE' ? 'Pending Customer' :
                     contract.status === 'ACTIVE' ? 'Active' :
                     contract.status === 'REJECTED' ? 'Rejected' :
                     contract.status === 'CANCELLED' ? 'Cancelled' :
                     contract.status === 'EXPIRED' ? 'Expired' : contract.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Viewer */}
          <div className="xl:col-span-3">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl h-[85vh] flex flex-col">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 rounded-t-lg flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Contract Document</CardTitle>
                      <CardDescription>View and interact with the contract PDF</CardDescription>
                    </div>
                  </div>
                  {contract.filePath && (
                    <Button
                      onClick={() => contract.filePath && handleDownloadFile(contract.filePath)}
                      size="sm"
                      variant="outline"
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {contract.filePath ? (
                  pdfLoading ? (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-slate-700">Loading Document</h3>
                          <p className="text-slate-500">Preparing contract for viewing...</p>
                        </div>
                      </div>
                    </div>
                  ) : pdfBlobUrl ? (
                    <div className="h-full">
                      <PdfViewer fileUrl={pdfBlobUrl} />
                    </div>
                  ) : pdfError ? (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-50 to-orange-50">
                      <div className="text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <div>
                          <h3 className="text-lg font-semibold text-red-800">Document Error</h3>
                          <p className="text-red-600">{pdfError}</p>
                        </div>
                        <Button onClick={() => window.location.reload()}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Loading
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
                      <div className="text-center space-y-4">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                        <p className="text-slate-500 font-medium">Failed to load contract file</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-yellow-50 to-orange-50">
                    <div className="text-center space-y-4">
                      <FileText className="w-12 h-12 text-yellow-500 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-800">No Contract File</h3>
                        <p className="text-yellow-600">The PDF contract file has not been generated yet.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contract Items Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mt-8">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-200 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Contract Items</CardTitle>
                <CardDescription>Detailed breakdown of services and products</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!contract?.contractDetails || contract.contractDetails.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Contract Items</h3>
                <p className="text-slate-500">No items have been added to this contract yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Work Code
                        </div>
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Service/Item
                        </div>
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Qty
                        </div>
                      </th>
                      <th className="py-4 px-6 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="py-4 px-6 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total
                        </div>
                      </th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <Award className="w-4 h-4" />
                          Warranty
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contract.contractDetails.map((detail, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors duration-200 group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="font-semibold text-slate-900">{detail.workCode}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{detail.workCode}</div>
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <div className="text-sm text-slate-600 truncate" title={detail.description || 'No description'}>
                            {detail.description || 'No description'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                            {detail.quantity}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-semibold text-slate-900">{formatCurrency(detail.unitPrice)}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-bold text-slate-900 text-lg">{formatCurrency(detail.quantity * detail.unitPrice)}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {detail.warrantyMonths ? (
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                              <Award className="w-3 h-3 mr-1" />
                              {detail.warrantyMonths} month{detail.warrantyMonths > 1 ? 's' : ''}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-200 border-t-2 border-slate-300">
                      <td colSpan={5} className="py-6 px-6 text-right">
                        <div className="text-lg font-bold text-slate-800">Total Contract Value:</div>
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(contract?.totalValue || 0)}</div>
                      </td>
                      <td className="py-6 px-6"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Digital Signatures Section */}
        {signatures.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mt-8">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-green-50 border-b border-slate-200 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Digital Signatures ({signatures.length})</CardTitle>
                  <CardDescription>Cryptographically verified digital signatures</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {signatures.map((signature, index) => {
                  const verification = verificationResults.get(signature.id);
                  const isVerifying = loadingVerification.has(signature.id);
                  
                  return (
                    <Card key={signature.id} className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{signature.signerName}</h4>
                              <p className="text-sm text-slate-600">{signature.signerEmail}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(signature.signedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`${
                                signature.verificationStatus === 'VALID' 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : signature.verificationStatus === 'INVALID'
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}
                            >
                              {signature.verificationStatus}
                            </Badge>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifySignature(signature.id)}
                              disabled={isVerifying}
                            >
                              {isVerifying ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {verification && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <h5 className="font-medium text-sm mb-2">Verification Results:</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className={`flex items-center gap-1 ${verification.signatureValid ? 'text-green-600' : 'text-red-600'}`}>
                                {verification.signatureValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                Signature Valid
                              </div>
                              <div className={`flex items-center gap-1 ${verification.certificateValid ? 'text-green-600' : 'text-red-600'}`}>
                                {verification.certificateValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                Certificate Valid
                              </div>
                              <div className={`flex items-center gap-1 ${verification.documentIntegrityValid ? 'text-green-600' : 'text-red-600'}`}>
                                {verification.documentIntegrityValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                Document Integrity
                              </div>
                              <div className={`flex items-center gap-1 ${verification.timestampValid ? 'text-green-600' : 'text-red-600'}`}>
                                {verification.timestampValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                Timestamp Valid
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" size="lg" className="hover:bg-slate-50 hover:scale-105 transition-all duration-300">
            <Link href="/contracts">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Contracts
            </Link>
          </Button>
        </div>
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

