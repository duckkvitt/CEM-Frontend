'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Upload, FileText } from 'lucide-react'
import { createContract, CreateContractRequest, ContractDetail } from '@/lib/contract-service'
import { getAccessToken } from '@/lib/auth'
import { uploadContractFile as uploadContractFileApi } from '@/lib/contract-service'

interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
}

interface Device {
  id: number
  name: string
  model?: string
  serialNumber?: string
  price?: number
  unit?: string
}

interface DeliverySchedule {
  itemName: string;
  unit: string;
  quantity: number;
  deliveryTime: string;
  deliveryLocation: string;
  notes: string;
}

interface CreateContractModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateContractModal({ isOpen, onClose, onSuccess }: CreateContractModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  
  function createEmptyContractDetail(): ContractDetail {
    return {
      workCode: `WK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      deviceId: 0,
      description: '',
      quantity: 1,
      unitPrice: 0,
      warrantyMonths: 12
    }
  }

  function createEmptyDeliverySchedule(): DeliverySchedule {
    return {
      itemName: '',
      unit: '',
      quantity: 1,
      deliveryTime: '',
      deliveryLocation: '',
      notes: ''
    }
  }

  const [formData, setFormData] = useState<CreateContractRequest>({
    title: '',
    description: '',
    customerId: 0,
    startDate: '',
    endDate: '',
    contractDetails: [createEmptyContractDetail()],
    // Điều 2: Thanh toán
    paymentMethod: '',
    paymentTerm: '',
    bankAccount: '',
    // Điều 3: Delivery Schedule
    deliverySchedules: [createEmptyDeliverySchedule()],
    // Điều 5: Bảo hành
    warrantyProduct: '',
    warrantyPeriodMonths: 12
  })
  
  // Load customers and devices on modal open
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchDevices()
    }
  }, [isOpen])

  // Sync delivery schedule when devices are loaded or contract details change
  useEffect(() => {
    if (devices.length > 0 && formData.contractDetails.length > 0) {
      syncDeliveryScheduleWithContractDetails()
    }
  }, [devices, formData.contractDetails])
  
  async function fetchCustomers() {
    setCustomersLoading(true)
    try {
      const response = await fetch('/api/customer/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      setCustomers(data.data.content || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('Failed to load customers. Please try again.')
    } finally {
      setCustomersLoading(false)
    }
  }
  
  async function fetchDevices() {
    setDevicesLoading(true)
    try {
      const response = await fetch('/api/device/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch devices')
      
      const data = await response.json()
      setDevices(data.data.content || [])
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError('Failed to load devices. Please try again.')
    } finally {
      setDevicesLoading(false)
    }
  }
  
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  function handleDetailChange(index: number, field: string, value: string | number) {
    setFormData(prev => {
      const updatedDetails = [...(prev.contractDetails || [])]
      
      // Handle numeric fields properly to avoid NaN
      let processedValue = value
      if (field === 'quantity' || field === 'unitPrice' || field === 'warrantyMonths') {
        if (typeof value === 'string') {
          // If empty string, set to 0 or appropriate default
          if (value === '' || value === null || value === undefined) {
            processedValue = field === 'quantity' ? 1 : 0
          } else {
            const parsed = parseInt(value)
            processedValue = isNaN(parsed) ? (field === 'quantity' ? 1 : 0) : parsed
          }
        }
      }
      
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: processedValue
      }
      
      // If device is selected, auto-populate the description and calculate unit price
      if (field === 'deviceId' && value) {
        const deviceId = Number(value)
        const selectedDevice = devices.find(d => d.id === deviceId)
        if (selectedDevice) {
          updatedDetails[index].description = `${selectedDevice.name} - ${selectedDevice.model || 'Unknown model'}`
          // Auto-calculate unit price based on device price
          if (selectedDevice.price) {
            updatedDetails[index].unitPrice = selectedDevice.price
          }
        }
      }
      
      // If quantity changes and device is selected, update unit price calculation
      if (field === 'quantity' && updatedDetails[index].deviceId) {
        const deviceId = updatedDetails[index].deviceId
        const selectedDevice = devices.find(d => d.id === deviceId)
        if (selectedDevice && selectedDevice.price) {
          updatedDetails[index].unitPrice = selectedDevice.price
        }
      }
      
      return { ...prev, contractDetails: updatedDetails }
    })
  }
  
  function addContractDetail() {
    setFormData(prev => ({
      ...prev,
      contractDetails: [...(prev.contractDetails || []), createEmptyContractDetail()]
    }))
  }
  
  function removeContractDetail(index: number) {
    if ((formData.contractDetails?.length || 0) <= 1) return
    
    setFormData(prev => {
      const updatedDetails = [...(prev.contractDetails || [])]
      updatedDetails.splice(index, 1)
      return { ...prev, contractDetails: updatedDetails }
    })
  }
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    setFileError(null)
    
    if (!files || files.length === 0) {
      setContractFile(null)
      return
    }
    
    const file = files[0]
    
    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed')
      setContractFile(null)
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB')
      setContractFile(null)
      return
    }
    
    setContractFile(file)
  }
  
  async function uploadContractFile(): Promise<string | null> {
    if (!contractFile) return null;
    
    setUploadingFile(true);
    try {
      // Generate a temporary contract number for file upload in create mode
      const tempContractNumber = `TEMP_${Date.now()}`;
      const result = await uploadContractFileApi(contractFile, tempContractNumber);
      return result;
    } catch (err) {
      console.error('Error uploading file:', err);
      // Hiển thị lỗi cụ thể từ Google Drive
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload contract file';
      setFileError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  }
  
  function handleDeliveryScheduleChange(index: number, field: keyof DeliverySchedule, value: string | number) {
    const updatedSchedules = [...formData.deliverySchedules]
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value
    }
    setFormData({ ...formData, deliverySchedules: updatedSchedules })
  }

  // Function to sync delivery schedule with contract details
  function syncDeliveryScheduleWithContractDetails() {
    const updatedSchedules = formData.contractDetails.map((detail, index) => {
      if (detail.deviceId) {
        const selectedDevice = devices.find(d => d.id === detail.deviceId)
        if (selectedDevice) {
          return {
            itemName: selectedDevice.name,
            unit: selectedDevice.unit || '',
            quantity: detail.quantity,
            deliveryTime: formData.deliverySchedules[index]?.deliveryTime || '',
            deliveryLocation: formData.deliverySchedules[index]?.deliveryLocation || '',
            notes: formData.deliverySchedules[index]?.notes || ''
          }
        }
      }
      // If no device selected, create empty schedule
      return {
        itemName: '',
        unit: '',
        quantity: detail.quantity,
        deliveryTime: formData.deliverySchedules[index]?.deliveryTime || '',
        deliveryLocation: formData.deliverySchedules[index]?.deliveryLocation || '',
        notes: formData.deliverySchedules[index]?.notes || ''
      }
    })
    
    setFormData(prev => ({
      ...prev,
      deliverySchedules: updatedSchedules
    }))
  }

  // Delivery schedule is now automatically managed based on contract details
  // No manual add/remove functions needed
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Validate required fields
      if (!formData.customerId) {
        throw new Error('Please select a customer')
      }
      
      if (!formData.title) {
        throw new Error('Contract title is required')
      }
      
      // Upload file if provided
      let filePath = null
      if (contractFile) {
        filePath = await uploadContractFile()
        if (!filePath) {
          throw new Error('Failed to upload contract file')
        }
      }
      
      // Calculate total value from contract details
      const totalValue = formData.contractDetails?.reduce(
        (sum, detail) => sum + (detail.quantity * (detail.unitPrice || 0)), 
        0
      ) || 0
      
      // Submit form data
      await createContract({
        ...formData,
        customerId: Number(formData.customerId),
        totalValue,
        filePath: filePath || undefined
      })
      
      onSuccess()
    } catch (err) {
      console.error('Error creating contract:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'string') {
        setError(err)
      } else {
        setError('Failed to create contract. Please check your input and try again.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create New Contract</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                  required
                  disabled={customersLoading}
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                    </option>
                  ))}
                </select>
                {customersLoading && (
                  <p className="text-sm text-muted-foreground mt-1">Loading customers...</p>
                )}
              </div>
              
              {/* Contract Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contract Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                    required
                    placeholder="Contract title"
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary h-20"
                    placeholder="Contract description (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                {/* Contract File Upload */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Contract Document (PDF)</label>
                  <div className="border-2 border-dashed rounded-md p-4">
                    {contractFile ? (
                      <div className="flex items-center gap-2 w-full">
                        <FileText size={24} className="text-primary" />
                        <div className="flex-1 truncate">
                          <p className="font-medium">{contractFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContractFile(null)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer">
                        <Upload size={32} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400">PDF (max 5MB)</p>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {fileError && (
                    <p className="text-sm text-red-500 mt-1">{fileError}</p>
                  )}
                </div>
              </div>
              
              {/* Điều 2: Thanh toán */}
              <div className="border rounded-md p-4">
                <h3 className="text-md font-medium mb-4">Điều 2: Thanh toán</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hình thức thanh toán</label>
                    <input
                      type="text"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      placeholder="Ví dụ: Chuyển khoản, tiền mặt..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Thời hạn thanh toán</label>
                    <input
                      type="text"
                      name="paymentTerm"
                      value={formData.paymentTerm}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      placeholder="Ví dụ: Thanh toán trong vòng 30 ngày..."
                    />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Tài khoản ngân hàng</label>
                    <textarea
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary h-20"
                      placeholder="Thông tin tài khoản ngân hàng nhận thanh toán..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Điều 3: Thời gian, địa điểm, phương thức giao hàng */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Điều 3: Thời gian, địa điểm, phương thức giao hàng</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tự động đồng bộ với Contract Details. Chỉ cần nhập: Thời gian giao hàng, Địa điểm giao hàng, Ghi chú
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-50">
                                              <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">STT</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Tên hàng hóa</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Đơn vị</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Số lượng</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Thời gian giao hàng</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Địa điểm giao hàng</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                      {formData.deliverySchedules.map((schedule, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={schedule.itemName}
                              className="w-full p-1 border rounded text-sm bg-gray-50"
                              placeholder="Tự động điền từ thiết bị"
                              readOnly
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={schedule.unit}
                              className="w-full p-1 border rounded text-sm bg-gray-50"
                              placeholder="Tự động điền từ thiết bị"
                              readOnly
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={schedule.quantity}
                              className="w-full p-1 border rounded text-sm bg-gray-50"
                              placeholder="Tự động điền từ Contract Details"
                              readOnly
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={schedule.deliveryTime}
                              onChange={(e) => handleDeliveryScheduleChange(index, 'deliveryTime', e.target.value)}
                              className="w-full p-1 border rounded text-sm"
                              placeholder="VD: 15 ngày"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <textarea
                              value={schedule.deliveryLocation}
                              onChange={(e) => handleDeliveryScheduleChange(index, 'deliveryLocation', e.target.value)}
                              className="w-full p-1 border rounded text-sm"
                              placeholder="Địa điểm giao hàng"
                              rows={2}
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <textarea
                              value={schedule.notes}
                              onChange={(e) => handleDeliveryScheduleChange(index, 'notes', e.target.value)}
                              className="w-full p-1 border rounded text-sm"
                              placeholder="Ghi chú"
                              rows={2}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Điều 5: Bảo hành và hướng dẫn sử dụng hàng hóa */}
              <div className="border rounded-md p-4">
                <h3 className="text-md font-medium mb-4">Điều 5: Bảo hành và hướng dẫn sử dụng hàng hóa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Loại hàng bảo hành</label>
                    <input
                      type="text"
                      name="warrantyProduct"
                      value={formData.warrantyProduct}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      placeholder="Loại hàng hóa được bảo hành..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Thời gian bảo hành (tháng)</label>
                    <input
                      type="number"
                      name="warrantyPeriodMonths"
                      value={formData.warrantyPeriodMonths}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                      min="0"
                      placeholder="12"
                    />
                  </div>
                </div>
              </div>
              
              {/* Contract Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-medium">Contract Details</h3>
                  <button
                    type="button"
                    onClick={addContractDetail}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus size={16} /> Add Item
                  </button>
                </div>
                
                {formData.contractDetails?.map((detail, index) => (
                  <div key={index} className="border rounded-md p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeContractDetail(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                        disabled={(formData.contractDetails?.length || 0) <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Work Code</label>
                        <input
                          type="text"
                          value={detail.workCode}
                          onChange={(e) => handleDetailChange(index, 'workCode', e.target.value)}
                          className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Device</label>
                        <select
                          value={detail.deviceId || ''}
                          onChange={(e) => handleDetailChange(index, 'deviceId', Number(e.target.value))}
                          className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                          disabled={devicesLoading}
                        >
                          <option value="">Select a device (optional)</option>
                          {devices.map(device => (
                            <option key={device.id} value={device.id}>
                              {device.name} {device.serialNumber ? `(${device.serialNumber})` : ''}
                            </option>
                          ))}
                        </select>
                        {devicesLoading && (
                          <p className="text-xs text-muted-foreground mt-1">Loading devices...</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={detail.description || ''}
                          onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                          className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary h-16"
                          placeholder="Description (optional)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={detail.quantity}
                          onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                          className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit Price (VND)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={detail.unitPrice}
                          className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary bg-gray-50"
                          placeholder="Tự động tính từ giá thiết bị"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Warranty (Months)</label>
                        <input
                          type="number"
                          min="0"
                          value={detail.warrantyMonths || 0}
                          onChange={(e) => handleDetailChange(index, 'warrantyMonths', e.target.value)}
                          className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <input
                          type="text"
                          value={detail.notes || ''}
                          onChange={(e) => handleDetailChange(index, 'notes', e.target.value)}
                          className="w-full border rounded-md p-2 focus:ring-2 focus:ring-primary"
                          placeholder="Additional notes (optional)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                disabled={loading || uploadingFile}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70"
                disabled={loading || uploadingFile}
              >
                {loading || uploadingFile ? 'Creating...' : 'Create Contract'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
