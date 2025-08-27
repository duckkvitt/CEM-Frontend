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
    unitOfMeasurement: string;
}

export interface UpdateSparePartRequest {
    partName?: string;
    description?: string;
    compatibleDevices?: string;
    unitOfMeasurement?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

async function handleResponse<T>(response: Response): Promise<T> {
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType || 'no content type'}`);
    }

    // Check if response has body
    const text = await response.text();
    if (!text) {
        throw new Error('Empty response from server');
    }

    let json;
    try {
        json = JSON.parse(text);
    } catch (error) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
        const error = (json && json.message) || response.statusText;
        console.error('API Error:', json);
        throw new Error(error);
    }
    
    return (json as ApiResponse<T>).data;
}

// Client-side fetch function (requires authentication)
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
export async function getAllSpareParts(page = 0, size = 10, sortBy = 'id', sortDir = 'asc', keyword?: string): Promise<PagedSparePartsResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDir,
    });
    
    if (keyword && keyword.trim()) {
        params.append('keyword', keyword.trim());
    }
    
    // SPARE_PARTS_SERVICE_URL already points to gateway /api/spare-parts
    // Backend controller for listing is mapped at '/spare-parts'
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
    try {
        const response = await authenticatedFetch<any>(`${SPARE_PARTS_SERVICE_URL}/${id}/hide`, {
            method: 'PATCH',
        });
        
        // Handle different response formats
        if (typeof response === 'string') {
            return response;
        } else if (response && typeof response === 'object') {
            return response.message || response.data || 'Spare part hidden successfully';
        } else {
            return 'Spare part hidden successfully';
        }
    } catch (error) {
        // If the API call fails, throw the error
        throw error;
    }
} 