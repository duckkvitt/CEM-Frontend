export type SparePartStatus = "ACTIVE" | "INACTIVE";

export interface SparePart {
  id: number;
  partName: string;
  partCode: string;
  description: string;
  compatibleDevices: string;
  unitOfMeasurement: string;
  status: SparePartStatus;
  createdAt: string; // Assuming ISO string format
  updatedAt: string; // Assuming ISO string format
}

export interface PagedSparePartsResponse {
  content: SparePart[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
} 