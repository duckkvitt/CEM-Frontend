'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DEVICE_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout, getCurrentUserRole  } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Shield, Settings, Tag, Hash, Calendar, DollarSign, Package } from 'lucide-react'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'BROKEN', label: 'Broken', color: 'bg-red-100 text-red-800' },
  { value: 'DISCONTINUED', label: 'Discontinued', color: 'bg-purple-100 text-purple-800' }
]

export default function CreateDevicePage() {
  const router = useRouter()
  const role = getCurrentUserRole()
  const [form, setForm] = useState({
    name: '',
    model: '',
    serialNumber: '',
    warrantyExpiry: '',
    price: '',
    unit: '',
    status: 'ACTIVE'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (role && role !== 'STAFF') {
      router.replace('/dashboard')
    }
  }, [role, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let newValue = value
    
    if (name === 'price') {
      newValue = value.replace(/[^0-9.]/g, '')
    }
    
    setForm(prev => ({ ...prev, [name]: newValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const payload = {
        name: form.name,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        unit: form.unit || undefined,
        status: form.status || undefined
      }
      
      const res = await fetch(`${DEVICE_SERVICE_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getValidAccessToken()}`
        },
        body: JSON.stringify(payload)
      })
      
      const json: ApiResponse<unknown> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to create device')
      
      setSuccess('Device created successfully! Redirecting...')
      setTimeout(() => router.push('/devices'), 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error occurred'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option ? (
      <Badge className={option.color} variant="secondary">
        {option.label}
      </Badge>
    ) : null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4 hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Devices
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Device</h1>
              <p className="text-gray-600 mt-1">Create a new device entry in the inventory system</p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              Device Information
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Fill in the details below to add a new device to your inventory
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Basic Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Device Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      value={form.name} 
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter device name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-medium text-gray-700">
                      Model
                    </Label>
                    <Input 
                      id="model" 
                      name="model" 
                      value={form.model} 
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter model number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700">
                      Serial Number
                    </Label>
                    <Input 
                      id="serialNumber" 
                      name="serialNumber" 
                      value={form.serialNumber} 
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter serial number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <select 
                      id="status" 
                      name="status" 
                      value={form.status} 
                      onChange={handleChange} 
                      className="h-11 w-full border border-gray-200 rounded-md px-3 focus:border-blue-500 focus:ring-blue-500 bg-white"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Financial & Warranty Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Financial & Warranty</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Price
                    </Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={form.price} 
                      onChange={handleChange} 
                      placeholder="0.00" 
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium text-gray-700">
                      Unit
                    </Label>
                    <Input 
                      id="unit" 
                      name="unit" 
                      value={form.unit} 
                      onChange={handleChange} 
                      placeholder="Unit" 
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="warrantyExpiry" className="text-sm font-medium text-gray-700">
                      Warranty Expiry
                    </Label>
                    <Input 
                      id="warrantyExpiry" 
                      name="warrantyExpiry" 
                      type="date" 
                      value={form.warrantyExpiry} 
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Current Status:</span>
                </div>
                {getStatusBadge(form.status)}
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Device...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Device
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 