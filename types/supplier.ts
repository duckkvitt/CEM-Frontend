import { SparePart } from './spare-part';

export type SupplierStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Supplier {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  fax?: string;
  address: string;
  taxCode?: string;
  businessLicense?: string;
  website?: string;
  description?: string;
  spareParts: SparePart[];
  suppliesDevices: boolean;
  suppliesSpareParts: boolean;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PagedSuppliersResponse {
  content: Supplier[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CreateSupplierRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  fax?: string;
  address: string;
  taxCode?: string;
  businessLicense?: string;
  website?: string;
  description?: string;
  sparePartIds?: number[];
}

export interface UpdateSupplierRequest {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  taxCode?: string;
  businessLicense?: string;
  website?: string;
  description?: string;
  sparePartIds?: number[];
  status?: SupplierStatus;
}