'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, FileText, Upload, X, AlertCircle, CheckCircle, Wrench, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomerDevice } from '@/lib/device-service'
import { createServiceRequest, CreateServiceRequestRequest } from '@/lib/service-request-service'
import { uploadContractFile } from '@/lib/contract-service'

interface ServiceRequestModalProps {
  isOpen: boolean
  onClose: () => void
  device: CustomerDevice
  onSuccess?: () => void
}

interface FormData {
  type: 'MAINTENANCE' | 'WARRANTY'
  description: string
  preferredDateTime: string
  customerComments: string
  attachments: File[]
}

export function ServiceRequestModal({ isOpen, onClose, device, onSuccess }: ServiceRequestModalProps) {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'warranty'>('maintenance')
  const [formData, setFormData] = useState<FormData>({
    type: 'MAINTENANCE',
    description: '',
    preferredDateTime: '',
    customerComments: '',
    attachments: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'maintenance' | 'warranty')
    setFormData(prev => ({
      ...prev,
      type: value === 'maintenance' ? 'MAINTENANCE' : 'WARRANTY'
    }))
  }

  const handleInputChange = (field: keyof FormData, value: string | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedIds: string[] = []
    
    for (const file of files) {
      try {
        // Generate a unique identifier for the file
        const timestamp = Date.now()
        const fileName = `service_request_${device.id}_${timestamp}_${file.name}`
        
        // Upload to Google Drive using the contract service
        const fileId = await uploadContractFile(file, fileName)
        uploadedIds.push(fileId)
      } catch (err) {
        console.error('Failed to upload file:', err)
        throw new Error(`Failed to upload ${file.name}`)
      }
    }
    
    return uploadedIds
  }

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      setError('Please provide a description of the issue')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Upload files if any
      let attachmentIds: string[] = []
      if (formData.attachments.length > 0) {
        attachmentIds = await uploadFiles(formData.attachments)
      }

      const request: CreateServiceRequestRequest = {
        deviceId: device.id,
        type: formData.type,
        description: formData.description.trim(),
        preferredDateTime: formData.preferredDateTime || undefined,
        customerComments: formData.customerComments.trim() || undefined,
        attachments: attachmentIds.length > 0 ? attachmentIds : undefined
      }

      await createServiceRequest(request)
      
      setSuccess(true)
      setTimeout(() => {
        onClose()
        onSuccess?.()
        // Reset form
        setFormData({
          type: 'MAINTENANCE',
          description: '',
          preferredDateTime: '',
          customerComments: '',
          attachments: []
        })
        setSuccess(false)
        setActiveTab('maintenance')
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit service request'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wrench className="h-6 w-6 text-blue-600" />
            Request Support
          </DialogTitle>
          <DialogDescription>
            Submit a maintenance or warranty request for your device: <strong>{device.deviceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Information */}
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Device Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Device Name</Label>
                  <p className="text-gray-900 font-medium">{device.deviceName}</p>
                </div>
                {device.deviceModel && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Model</Label>
                    <p className="text-gray-900">{device.deviceModel}</p>
                  </div>
                )}
                {device.serialNumber && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Serial Number</Label>
                    <p className="text-gray-900 font-mono">{device.serialNumber}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Device ID</Label>
                  <p className="text-gray-900">#{device.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Type Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Maintenance Request
              </TabsTrigger>
              <TabsTrigger value="warranty" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Warranty Request
              </TabsTrigger>
            </TabsList>

            <TabsContent value="maintenance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    Maintenance Request
                  </CardTitle>
                  <CardDescription>
                    Submit a request for device maintenance or repair services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description of the Issue *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Please describe the issue you're experiencing with your device..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferredDateTime" className="text-sm font-medium">
                      Preferred Date/Time for Service
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="preferredDateTime"
                        type="datetime-local"
                        value={formData.preferredDateTime}
                        onChange={(e) => handleInputChange('preferredDateTime', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerComments" className="text-sm font-medium">
                      Additional Comments
                    </Label>
                    <Textarea
                      id="customerComments"
                      placeholder="Any additional information or special requirements..."
                      value={formData.customerComments}
                      onChange={(e) => handleInputChange('customerComments', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warranty" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Warranty Request
                  </CardTitle>
                  <CardDescription>
                    Submit a warranty claim for device defects or issues covered under warranty
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="warranty-description" className="text-sm font-medium">
                      Description of the Defect/Issue *
                    </Label>
                    <Textarea
                      id="warranty-description"
                      placeholder="Please describe the defect or issue you're experiencing..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="warranty-preferredDateTime" className="text-sm font-medium">
                      Preferred Date/Time for Service
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="warranty-preferredDateTime"
                        type="datetime-local"
                        value={formData.preferredDateTime}
                        onChange={(e) => handleInputChange('preferredDateTime', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="warranty-customerComments" className="text-sm font-medium">
                      Additional Comments
                    </Label>
                    <Textarea
                      id="warranty-customerComments"
                      placeholder="Any additional information about the warranty claim..."
                      value={formData.customerComments}
                      onChange={(e) => handleInputChange('customerComments', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Attachments (Optional)
              </CardTitle>
              <CardDescription>
                Upload photos or documents related to your request (max 5 files, 10MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Click to upload files
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, PDF, DOC, DOCX up to 10MB each
                </p>
              </div>

              {/* File List */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Files:</Label>
                  {formData.attachments.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Service request submitted successfully! You will receive a confirmation email shortly.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.description.trim()}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 