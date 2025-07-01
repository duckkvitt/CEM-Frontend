import { NextRequest, NextResponse } from 'next/server'
import { CLOUDINARY_CONFIG } from '@/lib/api'
import { v2 as cloudinary } from 'cloudinary'

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.cloudName,
  api_key: CLOUDINARY_CONFIG.apiKey,
  api_secret: CLOUDINARY_CONFIG.apiSecret
})

export async function POST(req: NextRequest) {
  try {
    // Kiểm tra xác thực
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lấy dữ liệu từ formData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Kiểm tra loại file
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Chuyển đổi File thành buffer để upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload lên Cloudinary
    const folder = formData.get('folder') as string || 'contracts'
    
    return new Promise<NextResponse>((resolve, reject) => {
      // Sử dụng stream để upload
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            resolve(NextResponse.json({ error: error.message }, { status: 500 }))
            return
          }
          
          resolve(NextResponse.json(result))
        }
      )
      
      // Ghi buffer vào stream
      uploadStream.write(buffer)
      uploadStream.end()
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
} 