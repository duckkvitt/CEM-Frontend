import { CONTRACT_SERVICE_URL } from './api'
import { getAccessToken } from './auth'

export interface ContractDetail {
  workCode: string
  deviceId?: number
  description?: string
  quantity: number
  unitPrice: number
  warrantyMonths?: number
  notes?: string
}

export interface DeliverySchedule {
  itemName: string
  unit: string
  quantity: number
  deliveryTime?: string
  deliveryLocation?: string
  notes?: string
}

export interface CreateContractRequest {
  title: string
  description?: string
  customerId: number
  startDate?: string
  endDate?: string
  contractDetails: ContractDetail[]
  
  // Điều 2: Thanh toán
  paymentMethod?: string
  paymentTerm?: string 
  bankAccount?: string
  
  // Điều 3: Thời gian, địa điểm, phương thức giao hàng - now managed as a table
  deliverySchedules: DeliverySchedule[]
  
  // Điều 5: Bảo hành và hướng dẫn sử dụng hàng hóa
  warrantyProduct?: string
  warrantyPeriodMonths?: number
}

export interface UploadExistContractRequest {
  title: string
  description?: string
  customerId: number
  contractDetails: ContractDetail[]
  filePath: string
  
  // Điều 3: Thời gian, địa điểm, phương thức giao hàng - now managed as a table
  deliverySchedules: DeliverySchedule[]
}

export interface UpdateContractRequest {
  title: string
  description?: string
  totalValue?: number
  startDate?: string
  endDate?: string
  contractDetails?: ContractDetail[]
  filePath?: string
}

export interface SignatureRequest {
  signature: string;
}

// New interfaces for digital signature system - Updated to match backend API
export interface DigitalSignatureRequest {
  contractId?: number;
  certificateId?: number;
  signerType: string; // MANAGER, CUSTOMER, STAFF
  signerId?: number;
  signerName: string;
  signerEmail: string;
  signatureData: string; // Base64 encoded PNG from canvas
  pageNumber?: number; // PDF page number (1-based)
  signatureX?: number; // X coordinate
  signatureY?: number; // Y coordinate
  signatureWidth?: number; // Signature width
  signatureHeight?: number; // Signature height
  reason?: string; // Reason for signing
  location?: string; // Geographic location
  contactInfo?: string; // Contact information
  ipAddress?: string; // Client IP address
  userAgent?: string; // Browser user agent
  includeTimestamp?: boolean; // Whether to include RFC 3161 timestamp
  timestampUrl?: string; // Custom TSA URL (optional)
}

export interface DigitalSignatureRecord {
  id: number;
  contractId: number;
  signerName: string;
  signerEmail: string;
  canvasSignatureData: string;
  signatureHash: string;
  certificateFingerprint?: string;
  signedAt: string;
  verificationStatus: string;
  signatureReason?: string;
  signatureLocation?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface SignatureVerificationResult {
  signatureValid: boolean;
  certificateValid: boolean;
  documentIntegrityValid: boolean;
  timestampValid: boolean;
  verificationTime: string;
  errorMessage?: string;
  certificateDetails?: Record<string, unknown>;
}

export interface ContractResponse {
  id: number
  contractNumber: string
  title: string
  description?: string
  status: string
  totalValue?: number
  customerId: number
  staffId: number
  filePath?: string
  startDate?: string
  endDate?: string
  createdAt: string
  isHidden?: boolean // Add this field to match backend response
  contractDetails: ContractDetail[]
  
  // Điều 2: Thanh toán
  paymentMethod?: string
  paymentTerm?: string
  bankAccount?: string
  
  // Điều 3: Thời gian, địa điểm, phương thức giao hàng - now managed as a table
  deliverySchedules: DeliverySchedule[]
  
  // Điều 5: Bảo hành và hướng dẫn sử dụng hàng hóa
  warrantyProduct?: string
  warrantyPeriodMonths?: number
}

interface ApiResponse<T> {
  data: T
  message: string
  status: string
  timestamp: string
}

// Common error handling function
async function handleErrors(response: Response): Promise<void> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      // Extract error message from backend response
      if (errorData.message) {
        throw new Error(errorData.message);
      } else if (errorData.errors && Array.isArray(errorData.errors)) {
        // Handle validation errors
        const errorMessages = errorData.errors.map((err: any) => err.defaultMessage || err.message).join(', ');
        throw new Error(errorMessages);
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (parseError) {
      // If we can't parse the error response, fall back to status code
      throw new Error(`API Error: ${response.status}`);
    }
  }
}

// Helper for making authenticated requests
async function authenticatedFetch<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  await handleErrors(response);
  const data: ApiResponse<T> = await response.json();
  return data.data;
}

// Create a new contract
export async function createContract(contract: CreateContractRequest): Promise<ContractResponse> {
  // Append trailing slash to avoid 302 redirect from Spring when posting to root path
  const url = CONTRACT_SERVICE_URL.endsWith('/') ? CONTRACT_SERVICE_URL : `${CONTRACT_SERVICE_URL}/`
  return authenticatedFetch<ContractResponse>(
    url,
    {
      method: 'POST',
      body: JSON.stringify(contract),
    }
  );
}

// Upload an existing contract
export async function uploadExistContract(contract: UploadExistContractRequest): Promise<ContractResponse> {
  const url = `${CONTRACT_SERVICE_URL}/upload-exist`
  return authenticatedFetch<ContractResponse>(
    url,
    {
      method: 'POST',
      body: JSON.stringify(contract),
    }
  );
}

// Update an existing contract
export async function updateContract(
  id: number, 
  contract: UpdateContractRequest
): Promise<ContractResponse> {
  return authenticatedFetch<ContractResponse>(
    `${CONTRACT_SERVICE_URL}/${id}`, 
    {
      method: 'PUT',
      body: JSON.stringify(contract),
    }
  );
}

// Get contract details
export async function getContractDetails(id: number): Promise<ContractResponse> {
  return authenticatedFetch<ContractResponse>(`${CONTRACT_SERVICE_URL}/${id}`);
}

// Get list of unsigned contracts
export async function getUnsignedContracts(
  page = 0, 
  size = 10
): Promise<{ content: ContractResponse[]; totalElements: number; totalPages: number }> {
  return authenticatedFetch<{ content: ContractResponse[]; totalElements: number; totalPages: number }>(
    `${CONTRACT_SERVICE_URL}/unsigned?page=${page}&size=${size}`
  );
}

// Get list of signed contracts
export async function getSignedContracts(
  page = 0, 
  size = 10
): Promise<{ content: ContractResponse[]; totalElements: number; totalPages: number }> {
  return authenticatedFetch<{ content: ContractResponse[]; totalElements: number; totalPages: number }>(
    `${CONTRACT_SERVICE_URL}/signed?page=${page}&size=${size}`
  );
}

// Get list of hidden contracts
export async function getHiddenContracts(
  page = 0, 
  size = 10
): Promise<{ content: ContractResponse[]; totalElements: number; totalPages: number }> {
  return authenticatedFetch<{ content: ContractResponse[]; totalElements: number; totalPages: number }>(
    `${CONTRACT_SERVICE_URL}/hidden?page=${page}&size=${size}`
  );
}

// Hide a contract
export async function hideContract(id: number): Promise<string> {
  return authenticatedFetch<string>(
    `${CONTRACT_SERVICE_URL}/${id}/hide`, 
    { method: 'POST' }
  );
}

// Restore a hidden contract
export async function restoreContract(id: number): Promise<string> {
  return authenticatedFetch<string>(
    `${CONTRACT_SERVICE_URL}/${id}/restore`, 
    { method: 'POST' }
  );
}

// Upload contract file
export async function uploadContractFile(
  file: File, 
  contractNumber: string
): Promise<string> {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('contractNumber', contractNumber);
  
  const response = await fetch(`${CONTRACT_SERVICE_URL.replace('/contracts', '')}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  handleErrors(response);
  const data: ApiResponse<string> = await response.json();
  return data.data;
}

// Download contract file
export function getContractFileUrl(fileName: string): string {
  // Get signed download URL from backend
  return `${CONTRACT_SERVICE_URL.replace('/contracts', '')}/files/download-url/${fileName}`;
}

// Get direct download URL for contract file via backend (Google Drive redirect)
export async function getSignedDownloadUrl(fileName: string): Promise<string> {
  try {
    const token = getAccessToken() ?? ''
    return `${CONTRACT_SERVICE_URL.replace('/contracts', '')}/files/download-direct/${fileName}?token=${token}`;
  } catch (error) {
    console.error('Error getting signed download URL:', error);
    throw error;
  }
}

// Get contract file info
export async function getContractFileInfo(fileName: string): Promise<Record<string, unknown>> {
  return authenticatedFetch<Record<string, unknown>>(
    `${CONTRACT_SERVICE_URL.replace('/contracts', '')}/files/info/${fileName}`
  );
}

// Delete contract file
export async function deleteContractFile(fileName: string): Promise<string> {
  return authenticatedFetch<string>(
    `${CONTRACT_SERVICE_URL.replace('/contracts', '')}/files/delete/${fileName}`, 
    { method: 'POST' }
  );
} 

// Updated signature submission using new digital signature endpoint
export async function submitDigitalSignature(contractId: number, signatureData: DigitalSignatureRequest): Promise<DigitalSignatureRecord> {
  signatureData.contractId = contractId;
  const url = `${CONTRACT_SERVICE_URL}/${contractId}/digital-signature`;
  return authenticatedFetch<DigitalSignatureRecord>(url, {
    method: 'POST',
    body: JSON.stringify(signatureData),
  });
}

// Get all signatures for a contract
export async function getContractSignatures(contractId: number): Promise<DigitalSignatureRecord[]> {
  const url = `${CONTRACT_SERVICE_URL}/${contractId}/signatures`;
  return authenticatedFetch<DigitalSignatureRecord[]>(url);
}

// Verify a digital signature
export async function verifySignature(signatureId: number): Promise<SignatureVerificationResult> {
  const url = `${CONTRACT_SERVICE_URL}/signatures/${signatureId}/verify`;
  return authenticatedFetch<SignatureVerificationResult>(url, {
    method: 'POST',
  });
}

// Legacy signature submission (deprecated - kept for backward compatibility)
export async function submitSignature(contractId: number, signatureData: SignatureRequest): Promise<Record<string, unknown>> {
  const url = `${CONTRACT_SERVICE_URL}/${contractId}/signatures`;
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(signatureData),
  });
}

// Get all contracts for the current user (could be any role)
export async function getContractsForCurrentUser(): Promise<ContractResponse[]> {
  // Use paginated endpoint and return content list for current user
  const result = await getContractsWithFilters(0, 100)
  return result.content
}

// Get contracts with pagination and filtering
export async function getContractsWithFilters(
  page = 0,
  size = 10,
  customerId?: number,
  search?: string,
  status?: string
): Promise<{ content: ContractResponse[]; totalElements: number; totalPages: number }> {
  let url = `${CONTRACT_SERVICE_URL}/?page=${page}&size=${size}`
  
  if (customerId) {
    url += `&customerId=${customerId}`
  }
  
  if (search) {
    url += `&search=${encodeURIComponent(search)}`
  }
  
  if (status) {
    url += `&status=${encodeURIComponent(status)}`
  }
  
  const response = await authenticatedFetch<{ content: ContractResponse[]; totalElements: number; totalPages: number; size: number; number: number; first: boolean; last: boolean }>(url)
  
  return {
    content: response.content,
    totalElements: response.totalElements,
    totalPages: response.totalPages
  }
}

// Get PDF file content as blob URL for PDF viewer
export async function getContractFileBlob(contractId: number, cacheBuster?: number): Promise<string> {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Add cache buster to URL to ensure fresh PDF after signatures
  const url = cacheBuster 
    ? `${CONTRACT_SERVICE_URL}/${contractId}/file?_t=${cacheBuster}`
    : `${CONTRACT_SERVICE_URL}/${contractId}/file`;

  const response = await fetch(url, {
    headers,
    cache: 'no-store', // Disable browser cache
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contract file: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
} 