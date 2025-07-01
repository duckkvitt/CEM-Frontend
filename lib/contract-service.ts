import { CONTRACT_SERVICE_URL } from './api'
import { getAccessToken } from './auth'

export interface ContractDetail {
  workCode: string
  deviceId?: number
  serviceName: string
  description?: string
  quantity: number
  unitPrice: number
  warrantyMonths?: number
  notes?: string
}

export interface CreateContractRequest {
  customerId: number
  title: string
  description?: string
  totalValue?: number
  startDate?: string
  endDate?: string
  contractDetails?: ContractDetail[]
  filePath?: string
}

export interface UpdateContractRequest {
  title: string
  description?: string
  totalValue?: number
  startDate?: string
  endDate?: string
  contractDetails?: ContractDetail[]
}

export interface SignContractRequest {
  signatureType: 'DIGITAL' | 'PAPER' | 'DIGITAL_IMAGE'
  signerName: string
  signerEmail: string
  signatureData?: string
  notes?: string
}

export interface ContractResponse {
  id: number
  contractNumber: string
  customerId: number
  customerName?: string
  staffId: number
  staffName?: string
  title: string
  description?: string
  totalValue: number
  startDate?: string
  endDate?: string
  status: 'UNSIGNED' | 'PAPER_SIGNED' | 'DIGITALLY_SIGNED' | 'CANCELLED' | 'EXPIRED'
  filePath?: string
  digitalSigned: boolean
  paperConfirmed: boolean
  isHidden: boolean
  createdAt: string
  updatedAt?: string
  signedAt?: string
  contractDetails?: {
    id: number
    contractId: number
    workCode: string
    deviceId?: number
    deviceName?: string
    serviceName: string
    description?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    warrantyMonths?: number
    notes?: string
    createdAt: string
    updatedAt?: string
  }[]
  signatures?: {
    id: number
    contractId: number
    signerName: string
    signerEmail: string
    signerType: string
    signatureType: string
    signatureData?: string
    notes?: string
    createdAt: string
  }[]
  daysUntilExpiry?: number
  isExpiringSoon?: boolean
}

interface ApiResponse<T> {
  data: T
  message: string
  status: string
  timestamp: string
}

// Common error handling function
function handleErrors(response: Response): void {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
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

  handleErrors(response);
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
  return authenticatedFetch<any>(
    `${CONTRACT_SERVICE_URL}/unsigned?page=${page}&size=${size}`
  );
}

// Get list of signed contracts
export async function getSignedContracts(
  page = 0, 
  size = 10
): Promise<{ content: ContractResponse[]; totalElements: number; totalPages: number }> {
  return authenticatedFetch<any>(
    `${CONTRACT_SERVICE_URL}/signed?page=${page}&size=${size}`
  );
}

// Get list of hidden contracts
export async function getHiddenContracts(
  page = 0, 
  size = 10
): Promise<{ content: ContractResponse[]; totalElements: number; totalPages: number }> {
  return authenticatedFetch<any>(
    `${CONTRACT_SERVICE_URL}/hidden?page=${page}&size=${size}`
  );
}

// Sign contract with e-signature
export async function signContract(
  id: number, 
  signRequest: SignContractRequest
): Promise<ContractResponse> {
  return authenticatedFetch<ContractResponse>(
    `${CONTRACT_SERVICE_URL}/${id}/sign`, 
    {
      method: 'POST',
      body: JSON.stringify(signRequest),
    }
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
  const token = getAccessToken();
  // Add token as query parameter for authenticated download
  return `${CONTRACT_SERVICE_URL.replace('/contracts', '')}/files/download/${fileName}?token=${token}`;
}

// Get contract file info
export async function getContractFileInfo(fileName: string): Promise<any> {
  return authenticatedFetch<any>(
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