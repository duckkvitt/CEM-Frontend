import { SUPPLIERS_SERVICE_URL } from './api';
import { getAccessToken } from './auth';
import { 
  Supplier, 
  PagedSuppliersResponse, 
  CreateSupplierRequest, 
  UpdateSupplierRequest, 
  SupplierStatus 
} from '@/types/supplier';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
  timestamp: string;
  path?: string;
  status?: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType || 'no content type'}`);
  }

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

export async function getAllSuppliers(
  page = 0, 
  size = 10, 
  sortBy = 'id', 
  sortDir = 'asc',
  keyword?: string,
  status?: SupplierStatus
): Promise<PagedSuppliersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy,
    sortDir,
  });
  
  if (keyword) params.append('keyword', keyword);
  if (status) params.append('status', status);
  
  return authenticatedFetch<PagedSuppliersResponse>(`${SUPPLIERS_SERVICE_URL}?${params.toString()}`);
}

export async function getSupplierById(id: number): Promise<Supplier> {
  return authenticatedFetch<Supplier>(`${SUPPLIERS_SERVICE_URL}/${id}`);
}

export async function createSupplier(request: CreateSupplierRequest): Promise<Supplier> {
  return authenticatedFetch<Supplier>(`${SUPPLIERS_SERVICE_URL}`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateSupplier(id: number, request: UpdateSupplierRequest): Promise<Supplier> {
  return authenticatedFetch<Supplier>(`${SUPPLIERS_SERVICE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export async function deactivateSupplier(id: number): Promise<string> {
  try {
    const response = await authenticatedFetch<any>(`${SUPPLIERS_SERVICE_URL}/${id}/deactivate`, {
      method: 'PATCH',
    });
    
    if (typeof response === 'string') {
      return response;
    } else if (response && typeof response === 'object') {
      return response.message || response.data || 'Supplier deactivated successfully';
    } else {
      return 'Supplier deactivated successfully';
    }
  } catch (error) {
    throw error;
  }
}

export async function activateSupplier(id: number): Promise<string> {
  try {
    const response = await authenticatedFetch<any>(`${SUPPLIERS_SERVICE_URL}/${id}/activate`, {
      method: 'PATCH',
    });
    
    if (typeof response === 'string') {
      return response;
    } else if (response && typeof response === 'object') {
      return response.message || response.data || 'Supplier activated successfully';
    } else {
      return 'Supplier activated successfully';
    }
  } catch (error) {
    throw error;
  }
}

export async function deleteSupplier(id: number): Promise<string> {
  try {
    const response = await authenticatedFetch<any>(`${SUPPLIERS_SERVICE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (typeof response === 'string') {
      return response;
    } else if (response && typeof response === 'object') {
      return response.message || response.data || 'Supplier deleted successfully';
    } else {
      return 'Supplier deleted successfully';
    }
  } catch (error) {
    throw error;
  }
}

export async function getSuppliersBySparePartType(sparePartType: string): Promise<Supplier[]> {
  const params = new URLSearchParams({ sparePartType });
  return authenticatedFetch<Supplier[]>(`${SUPPLIERS_SERVICE_URL}/by-spare-part-type?${params.toString()}`);
}