import { DEVICE_SERVICE_URL, fetchWithAuth } from './api'

export interface CreateFeedbackRequest {
  serviceRequestId: number
  starRating: number
  comment?: string
}

export interface FeedbackItem {
  id: number
  serviceRequestId: number
  serviceRequestCode?: string
  customerId: number
  customerName?: string
  deviceId: number
  deviceName?: string
  deviceType?: string
  serviceType: 'MAINTENANCE' | 'WARRANTY'
  starRating: number
  comment?: string
  technicianId?: number
  technicianName?: string
  submittedAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export async function submitFeedback(payload: CreateFeedbackRequest): Promise<FeedbackItem> {
  const res = await fetchWithAuth(`${DEVICE_SERVICE_URL}/customer-feedbacks`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return res.data
}

export async function listFeedbacks(params: {
  starRating?: number
  serviceType?: 'MAINTENANCE' | 'WARRANTY'
  keyword?: string
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
} = {}): Promise<Page<FeedbackItem>> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
  })
  const res = await fetchWithAuth(`${DEVICE_SERVICE_URL}/customer-feedbacks?${qs.toString()}`)
  return res.data
}

export async function getFeedbackById(id: number): Promise<FeedbackItem> {
  const res = await fetchWithAuth(`${DEVICE_SERVICE_URL}/customer-feedbacks/${id}`)
  return res.data
}

export async function getMyFeedbackByServiceRequest(serviceRequestId: number): Promise<FeedbackItem | null> {
  const res = await fetchWithAuth(`${DEVICE_SERVICE_URL}/customer-feedbacks/me/by-service-request/${serviceRequestId}`)
  return res.data
}


