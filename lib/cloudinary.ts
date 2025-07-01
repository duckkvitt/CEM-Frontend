import { CLOUDINARY_CONFIG } from './api'
import { getAccessToken } from './auth'

/**
 * Upload a file to Cloudinary thông qua API endpoint của server
 * @param file The file to upload
 * @param folder Optional folder path in Cloudinary
 * @returns The Cloudinary response with URL and other metadata
 */
export async function uploadToCloudinary(file: File, folder: string = 'contracts'): Promise<CloudinaryResponse> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  })
  
  if (!response.ok) {
    let errorMessage = 'Failed to upload file'
    try {
      const errorData = await response.json()
      console.error('Upload error:', errorData)
      errorMessage = errorData.error || errorMessage
    } catch (e) {
      // Ignore JSON parsing error
    }
    throw new Error(errorMessage)
  }
  
  return response.json()
}

/**
 * Get a Cloudinary URL with optimized transformations for PDF
 * @param publicId The public ID of the uploaded file
 * @returns The optimized URL for the PDF
 */
export function getOptimizedPdfUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/fl_attachment/q_auto/${publicId}.pdf`
}

/**
 * Get a Cloudinary URL for PDF thumbnail preview
 * @param publicId The public ID of the uploaded file
 * @returns The thumbnail URL for the PDF
 */
export function getPdfThumbnailUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/c_thumb,w_200,h_250,pg_1/${publicId}.jpg`
}

export interface CloudinaryResponse {
  asset_id: string
  public_id: string
  version: number
  version_id: string
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  tags: string[]
  bytes: number
  type: string
  etag: string
  placeholder: boolean
  url: string
  secure_url: string
  folder: string
  access_mode: string
  original_filename: string
} 