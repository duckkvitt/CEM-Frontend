import { SPARE_PARTS_SERVICE_URL } from './api';
import { getAccessToken } from './auth';
import { PagedSparePartsResponse, SparePart } from '@/types/spare-part';

// Re-defining these here for now, should be in a central place
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
  timestamp: string;
  path?: string;
  status?: number;
}

export interface CreateSparePartRequest {
    partName: string;
    partCode: string;
    description?: string;
    compatibleDevices?: string;
    quantityInStock: number;
    unitOfMeasurement: string;
    supplier?: string;
}

export interface UpdateSparePartRequest {
    partName?: string;
    description?: string;
    compatibleDevices?: string;
    quantityInStock?: number;
    unitOfMeasurement?: string;
    supplier?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}


async function handleResponse<T>(response: Response): Promise<T> {
    const json = await response.json();
    if (!response.ok) {
        const error = (json && json.message) || response.statusText;
        console.error('API Error:', json);
        throw new Error(error);
    }
    return (json as ApiResponse<T>).data;
}

async function authenticatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  return handleResponse<T>(response);
}

// Service functions
export async function getAllSpareParts(page = 0, size = 10, sortBy = 'id', sortDir = 'asc'): Promise<PagedSparePartsResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDir,
    });
    return authenticatedFetch<PagedSparePartsResponse>(`${SPARE_PARTS_SERVICE_URL}?${params.toString()}`);
}

export async function getSparePartById(id: number): Promise<SparePart> {
    return authenticatedFetch<SparePart>(`${SPARE_PARTS_SERVICE_URL}/${id}`);
}

export async function createSparePart(request: CreateSparePartRequest): Promise<SparePart> {
    return authenticatedFetch<SparePart>(SPARE_PARTS_SERVICE_URL, {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

export async function updateSparePart(id: number, request: UpdateSparePartRequest): Promise<SparePart> {
    return authenticatedFetch<SparePart>(`${SPARE_PARTS_SERVICE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
    });
}

export async function hideSparePart(id: number): Promise<string> {
    const response = await authenticatedFetch<ApiResponse<string>>(`${SPARE_PARTS_SERVICE_URL}/${id}/hide`, {
        method: 'PATCH',
    });
    // Assuming the raw response from the generic fetch is the ApiResponse object itself
    return (response as any).message || 'Spare part hidden successfully';
} 