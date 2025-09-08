import { apiFetch } from './client'
import { extractErrorMessage } from '../error-utils'

export interface InventoryStats {
  totalDevices: number
  totalSpareParts: number
  lowStockDevices: number
  lowStockSpareParts: number
  outOfStockDevices: number
  outOfStockSpareParts: number
  totalValue: number
  lowStockValue: number
}

export interface DeviceInventory {
  id: number
  deviceId: number
  deviceName: string
  deviceModel: string
  deviceSerialNumber: string
  quantityInStock: number
  minimumStockLevel: number
  maximumStockLevel: number
  reorderPoint: number
  unitCost: number
  warehouseLocation: string
  notes: string
  isLowStock: boolean
  needsReorder: boolean
  isOutOfStock: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SparePartInventory {
  id: number
  sparePartId: number
  sparePartName: string
  sparePartModel: string
  quantityInStock: number
  minimumStockLevel: number
  maximumStockLevel: number
  reorderPoint: number
  unitCost: number
  warehouseLocation: string
  notes: string
  isLowStock: boolean
  needsReorder: boolean
  isOutOfStock: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface InventoryTransaction {
  id: number
  transactionNumber: string
  transactionType: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN'
  itemType: 'DEVICE' | 'SPARE_PART'
  itemId: number
  itemName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  supplierId: number
  supplierName: string
  referenceNumber: string
  referenceType: string
  referenceId: number
  transactionReason: string
  notes: string
  warehouseLocation: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isImport: boolean
  isExport: boolean
  isAdjustment: boolean
  isDevice: boolean
  isSparePart: boolean
}

export interface ImportRequest {
  itemType: 'DEVICE' | 'SPARE_PART'
  supplierId: number
  referenceNumber?: string
  warehouseLocation?: string
  notes?: string
  items: ImportItem[]
}

export interface ImportItem {
  itemId: number
  quantity: number
  notes?: string
}

export interface ExportRequest {
  itemType: 'DEVICE' | 'SPARE_PART'
  itemId: number
  quantity: number
  referenceNumber?: string
  referenceType?: string
  referenceId?: number
  transactionReason?: string
  notes?: string
  warehouseLocation?: string
}

export interface SparePart {
  id: number
  partName: string
  partCode: string
  description?: string
  category?: string
  manufacturer?: string
  specifications?: string
}

export interface Supplier {
  id: number
  name: string
  email: string
  phone: string
  address: string
  suppliesDevices: boolean
  suppliesSpareParts: boolean
  isActive: boolean
}

export interface SupplierDeviceType {
  id: number
  supplierId: number
  deviceType: string
  deviceModel: string
  isActive: boolean
}

// Simple shape for device selection in forms
export interface SimpleDevice {
  id: number
  name: string
  model: string
}

// Device Inventory API
export const getDeviceInventoryOverview = async (): Promise<DeviceInventory[]> => {
  try {
    console.log('Fetching device inventory from:', '/device/api/v1/inventory/devices')
    const response = await apiFetch('/device/api/v1/inventory/devices')
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    console.log('Response data:', data)
    return data.data || []
  } catch (error) {
    console.error('Error fetching device inventory:', error)
    console.log('Falling back to mock data')
    return mockDeviceInventory
  }
}

// Helper: list devices suitable for selection in forms
export const getDevicesForSelection = async (): Promise<SimpleDevice[]> => {
  const items = await getDeviceInventoryOverview()
  return items.map(d => ({ id: d.deviceId, name: d.deviceName, model: d.deviceModel }))
}

export const getLowStockDevices = async (): Promise<DeviceInventory[]> => {
  try {
    console.log('Fetching low stock devices from:', '/device/api/v1/inventory/devices/low-stock')
    const response = await apiFetch('/device/api/v1/inventory/devices/low-stock')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching low stock devices:', error)
    return mockDeviceInventory.filter(device => device.isLowStock)
  }
}

export const getDevicesNeedingReorder = async (): Promise<DeviceInventory[]> => {
  try {
    console.log('Fetching devices needing reorder from:', '/device/api/v1/inventory/devices/needing-reorder')
    const response = await apiFetch('/device/api/v1/inventory/devices/needing-reorder')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching devices needing reorder:', error)
    return mockDeviceInventory.filter(device => device.needsReorder)
  }
}

export const searchDeviceInventory = async (keyword: string): Promise<DeviceInventory[]> => {
  try {
    console.log('Searching device inventory with keyword:', keyword)
    const response = await apiFetch(`/device/api/v1/inventory/devices/search?keyword=${encodeURIComponent(keyword)}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error searching device inventory:', error)
    return mockDeviceInventory.filter(device => 
      device.deviceName.toLowerCase().includes(keyword.toLowerCase()) ||
      device.deviceModel.toLowerCase().includes(keyword.toLowerCase())
    )
  }
}

// Spare Parts Inventory API
export const getSparePartsInventory = async (): Promise<SparePart[]> => {
  try {
    console.log('Fetching spare parts from:', '/spare-parts')
    const response = await apiFetch('/spare-parts')
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    console.log('Response data:', data)
    // Backend returns ApiResponse<PagedResponse<SparePartResponse>> for list endpoint
    const paged = data?.data
    if (paged && Array.isArray(paged.content)) return paged.content
    if (Array.isArray(data?.data)) return data.data
    return []
  } catch (error) {
    console.error('Error fetching spare parts:', error)
    console.log('Falling back to mock data')
    return mockSpareParts
  }
}

// Get Spare Parts with Inventory Data
export const getSparePartsWithInventory = async (): Promise<SparePartInventory[]> => {
  try {
    console.log('Fetching spare parts with inventory from:', '/v1/spare-part-inventory/all-with-inventory')
    const response = await apiFetch('/v1/spare-part-inventory/all-with-inventory?size=1000')
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    console.log('Response data:', data)
    
    // Backend returns ApiResponse<PagedResponse<SparePartInventoryResponse>>
    const paged = data?.data
    const content: any[] = (paged && Array.isArray(paged.content))
      ? paged.content
      : Array.isArray(data?.data)
        ? data.data
        : []

    return content
      .filter((item: any) => item)
      .map((item: any, index: number) => {
        const sp = item.sparePart || item.sparePartResponse || null
        const sparePartId = item.sparePartId ?? sp?.id ?? sp?.sparePartId ?? null
        const sparePartName = item.sparePartName ?? sp?.partName ?? item.partName ?? 'Unknown Spare Part'
        const sparePartModel = item.sparePartModel ?? sp?.partCode ?? item.partCode ?? ''

        const quantityInStock = Number(item.quantityInStock ?? 0)
        const reorderPoint = Number(item.reorderPoint ?? 10)

        return {
          id: item.id ?? sparePartId ?? index + 1,
          sparePartId: sparePartId ?? 0,
          sparePartName,
          sparePartModel,
          quantityInStock,
          minimumStockLevel: Number(item.minimumStockLevel ?? 5),
          maximumStockLevel: Number(item.maximumStockLevel ?? 100),
          reorderPoint,
          unitCost: Number(item.unitCost ?? 0),
          warehouseLocation: item.warehouseLocation || 'Main Warehouse',
          notes: item.notes || '',
          isLowStock: quantityInStock <= reorderPoint,
          needsReorder: quantityInStock <= reorderPoint,
          isOutOfStock: quantityInStock === 0,
          createdBy: item.createdBy || 'system',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString()
        } as SparePartInventory
      })
      .filter((i: SparePartInventory) => typeof i.sparePartId === 'number')
  } catch (error) {
    console.error('Error fetching spare parts with inventory:', error)
    // Fallback to basic spare parts data
    try {
      const basicSpareParts = await getSparePartsInventory()
      return basicSpareParts.map((sp, index) => ({
        id: index + 1,
        sparePartId: sp.id,
        sparePartName: sp.partName,
        sparePartModel: sp.partCode,
        quantityInStock: 0, // Fallback to 0 if inventory data unavailable
        minimumStockLevel: 5,
        maximumStockLevel: 100,
        reorderPoint: 10,
        unitCost: 0,
        warehouseLocation: 'Main Warehouse',
        notes: sp.description || '',
        isLowStock: false,
        needsReorder: false,
        isOutOfStock: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return []
    }
  }
}

// Inventory Transactions API
export const getAllInventoryTransactions = async (): Promise<InventoryTransaction[]> => {
  try {
    console.log('Fetching inventory transactions from:', '/device/api/v1/inventory/transactions')
    const response = await apiFetch('/device/api/v1/inventory/transactions')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching inventory transactions:', error)
    return mockInventoryTransactions
  }
}

export const searchInventoryTransactions = async (keyword: string): Promise<InventoryTransaction[]> => {
  try {
    console.log('Searching inventory transactions with keyword:', keyword)
    const response = await apiFetch(`/device/api/v1/inventory/transactions/search?keyword=${encodeURIComponent(keyword)}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error searching inventory transactions:', error)
    return mockInventoryTransactions.filter(transaction => 
      transaction.itemName.toLowerCase().includes(keyword.toLowerCase()) ||
      transaction.transactionNumber.toLowerCase().includes(keyword.toLowerCase())
    )
  }
}

// Dashboard API
export const getInventoryDashboardStats = async (): Promise<InventoryStats> => {
  try {
    console.log('Fetching dashboard stats from:', '/device/api/v1/inventory/dashboard/stats')
    const response = await apiFetch('/device/api/v1/inventory/dashboard/stats')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    return data.data || mockInventoryStats
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return mockInventoryStats
  }
}

export const getRecentInventoryActivity = async (limit: number = 10): Promise<InventoryTransaction[]> => {
  try {
    console.log('Fetching recent activity with limit:', limit)
    const response = await apiFetch(`/device/api/v1/inventory/transactions?limit=${limit}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP error response:', errorText)
      // Try to parse error message from response body
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If parsing fails, use the error text directly
      }
      throw new Error(`Server error: ${errorText || 'Unknown error'}`)
    }
    
    const data = await response.json()
    return data.data || mockInventoryTransactions.slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return mockInventoryTransactions.slice(0, limit)
  }
}

// Import/Export API
export const importInventory = async (request: ImportRequest): Promise<any> => {
  try {
    // Route to device service for both device and spare part imports
    // The device service handles both types through SparePartIntegrationService
    const endpoint = '/device/api/v1/inventory/import'
    
    console.log(`Importing ${request.itemType} through device service endpoint: ${endpoint}`)
    
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(request)
    })
    if (!response.ok) {
      // Try to extract error message from response
      try {
        const errorData = await response.json();
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If we can't parse the error response, try to get text content
        try {
          const errorText = await response.text();
          if (errorText && errorText.trim()) {
            throw new Error(`Server error: ${errorText}`);
          }
        } catch (textError) {
          // Ignore text parsing errors
        }
      }
      const errorMessage = await extractErrorMessage(response)
      throw new Error(errorMessage)
    }
    return await response.json()
  } catch (error) {
    console.error('Error importing inventory:', error)
    throw error
  }
}

export const exportInventory = async (request: ExportRequest): Promise<any> => {
  try {
    // Route to device service for both device and spare part exports
    // The device service handles both types through SparePartIntegrationService
    const endpoint = '/device/api/v1/inventory/export'
    
    console.log(`Exporting ${request.itemType} through device service endpoint: ${endpoint}`)
    
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(request)
    })
    if (!response.ok) {
      // Try to extract error message from response
      try {
        const errorData = await response.json();
        if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (parseError) {
        // If we can't parse the error response, try to get text content
        try {
          const errorText = await response.text();
          if (errorText && errorText.trim()) {
            throw new Error(`Server error: ${errorText}`);
          }
        } catch (textError) {
          // Ignore text parsing errors
        }
      }
      const errorMessage = await extractErrorMessage(response)
      throw new Error(errorMessage)
    }
    return await response.json()
  } catch (error) {
    console.error('Error exporting inventory:', error)
    throw error
  }
}

// Suppliers API
export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    console.log('Fetching suppliers from:', '/suppliers')
    const response = await apiFetch('/suppliers')
    if (!response.ok) {
      console.warn('Suppliers API not ok, falling back to mock')
      return mockSuppliers
    }

    const raw = await response.json()
    const payload = raw?.data

    const list: any[] = Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(payload)
        ? payload
        : []

    // Normalize backend SupplierResponse -> lightweight Supplier used by inventory UI
    const normalized: Supplier[] = list.map((s: any) => ({
      id: s.id,
      name: s.companyName ?? s.name ?? 'Unknown Supplier',
      email: s.email,
      phone: s.phone,
      address: s.address ?? '',
      suppliesDevices: Boolean(s.suppliesDevices),
      // If backend does not expose this flag, infer from spareParts relation
      suppliesSpareParts: typeof s.suppliesSpareParts === 'boolean' ? s.suppliesSpareParts : Array.isArray(s.spareParts) ? s.spareParts.length > 0 : true,
      isActive: (s.status ?? s.isActive) === 'ACTIVE' || s.isActive === true,
    }))

    return normalized
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return mockSuppliers
  }
}

export const getSupplierDeviceTypes = async (): Promise<SupplierDeviceType[]> => {
  try {
    // Call the dedicated gateway route for supplier-device-types
    console.log('Fetching supplier device types from:', '/supplier-device-types')
    const response = await apiFetch('/supplier-device-types')
    if (!response.ok) {
      console.warn('SupplierDeviceTypes API not ok, falling back to mock')
      return mockSupplierDeviceTypes
    }
    
    const data = await response.json()
    const paged = data?.data
    if (paged && Array.isArray(paged.content)) return paged.content
    if (Array.isArray(data?.data)) return data.data
    return []
  } catch (error) {
    console.error('Error fetching supplier device types:', error)
    return mockSupplierDeviceTypes
  }
}

// Supplier-Device mapping APIs
export const getSupplierDevices = async (supplierId: number): Promise<SimpleDevice[]> => {
  try {
    const response = await apiFetch(`/device/api/v1/devices/suppliers/${supplierId}/devices`)
    if (!response.ok) return []
    const data = await response.json()
    const list = Array.isArray(data?.data) ? data.data : []
    return list.map((d: any) => ({ id: d.id, name: d.name ?? d.deviceName, model: d.model ?? d.deviceModel }))
  } catch {
    return []
  }
}

export const replaceSupplierDevices = async (supplierId: number, deviceIds: number[]): Promise<boolean> => {
  try {
    const response = await apiFetch(`/device/api/v1/devices/suppliers/${supplierId}/devices`, {
      method: 'POST',
      body: JSON.stringify({ deviceIds })
    })
    return response.ok
  } catch {
    return false
  }
}

export const unlinkSupplierDevice = async (supplierId: number, deviceId: number): Promise<boolean> => {
  try {
    const response = await apiFetch(`/device/api/v1/devices/suppliers/${supplierId}/devices/${deviceId}`, { method: 'DELETE' })
    return response.ok
  } catch {
    return false
  }
}

export const getSupplierDeviceTypesBySupplier = async (supplierId: number): Promise<SupplierDeviceType[]> => {
  try {
    const response = await apiFetch(`/supplier-device-types?supplierId=${supplierId}&size=200`)
    if (!response.ok) return []
    const data = await response.json()
    const paged = data?.data
    if (paged && Array.isArray(paged.content)) return paged.content
    if (Array.isArray(data?.data)) return data.data
    return []
  } catch (error) {
    console.error('Error fetching supplier device types by supplier:', error)
    return []
  }
}

export const createSupplierDeviceType = async (params: { supplierId: number; deviceType: string; deviceModel?: string; notes?: string }): Promise<SupplierDeviceType | null> => {
  try {
    const response = await apiFetch('/supplier-device-types', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: params.supplierId,
        deviceType: params.deviceType,
        deviceModel: params.deviceModel || undefined,
        notes: params.notes || undefined,
      })
    })
    if (!response.ok) return null
    const json = await response.json()
    return json?.data ?? null
  } catch (error) {
    console.error('Error creating supplier device type:', error)
    return null
  }
}

export const deactivateSupplierDeviceType = async (id: number): Promise<boolean> => {
  try {
    const response = await apiFetch(`/supplier-device-types/${id}`, { method: 'DELETE' })
    return response.ok
  } catch (error) {
    console.error('Error deactivating supplier device type:', error)
    return false
  }
}

// Mock data for development
export const mockDeviceInventory: DeviceInventory[] = [
  {
    id: 1,
    deviceId: 1,
    deviceName: 'Network Switch 24-Port',
    deviceModel: 'NS-24P',
    deviceSerialNumber: 'NS001-24P-001',
    quantityInStock: 15,
    minimumStockLevel: 5,
    maximumStockLevel: 50,
    reorderPoint: 8,
    unitCost: 300.00,
    warehouseLocation: 'A1-B2',
    notes: 'High-quality network switch for enterprise use',
    isLowStock: false,
    needsReorder: false,
    isOutOfStock: false,
    createdBy: 'admin@company.com',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z'
  },
  {
    id: 2,
    deviceId: 2,
    deviceName: 'Wireless Router',
    deviceModel: 'WR-AC1200',
    deviceSerialNumber: 'WR001-AC1200-001',
    quantityInStock: 3,
    minimumStockLevel: 5,
    maximumStockLevel: 20,
    reorderPoint: 6,
    unitCost: 90.00,
    warehouseLocation: 'A3-B4',
    notes: 'Dual-band wireless router',
    isLowStock: true,
    needsReorder: true,
    isOutOfStock: false,
    createdBy: 'admin@company.com',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-17T11:45:00Z'
  },
  {
    id: 3,
    deviceId: 3,
    deviceName: 'Security Camera',
    deviceModel: 'SC-4K',
    deviceSerialNumber: 'SC001-4K-001',
    quantityInStock: 0,
    minimumStockLevel: 2,
    maximumStockLevel: 15,
    reorderPoint: 3,
    unitCost: 150.00,
    warehouseLocation: 'C3-D4',
    notes: '4K security camera with night vision',
    isLowStock: false,
    needsReorder: false,
    isOutOfStock: true,
    createdBy: 'admin@company.com',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-17T09:30:00Z'
  }
]

export const mockSpareParts: SparePart[] = [
  {
    id: 1,
    partName: 'Network Cable Cat6',
    partCode: 'CAT6-1M',
    description: 'High-quality Cat6 network cables',
    category: 'Cables',
    manufacturer: 'TechCorp',
    specifications: 'Cat6, 1 meter, shielded'
  },
  {
    id: 2,
    partName: 'Power Supply Unit',
    partCode: 'PSU-500W',
    description: '500W power supply units',
    category: 'Power',
    manufacturer: 'PowerTech',
    specifications: '500W, ATX, 80+ Bronze'
  },
  {
    id: 3,
    partName: 'RAM Module',
    partCode: 'RAM-8GB',
    description: '8GB DDR4 RAM modules',
    category: 'Memory',
    manufacturer: 'MemoryCorp',
    specifications: '8GB, DDR4, 3200MHz'
  },
  {
    id: 4,
    partName: 'SSD Drive',
    partCode: 'SSD-500GB',
    description: '500GB SATA SSD drives',
    category: 'Storage',
    manufacturer: 'StorageTech',
    specifications: '500GB, SATA III, 6Gbps'
  },
  {
    id: 5,
    partName: 'Network Card',
    partCode: 'NIC-1G',
    description: '1Gbps network interface cards',
    category: 'Networking',
    manufacturer: 'NetCorp',
    specifications: '1Gbps, PCIe, RJ45'
  }
]

export const mockSparePartInventory: SparePartInventory[] = [
  {
    id: 1,
    sparePartId: 1,
    sparePartName: 'Network Cable Cat6',
    sparePartModel: 'CAT6-1M',
    quantityInStock: 500,
    minimumStockLevel: 100,
    maximumStockLevel: 1000,
    reorderPoint: 150,
    unitCost: 2.99,
    warehouseLocation: 'E5-F6',
    notes: 'High-quality Cat6 network cables',
    isLowStock: false,
    needsReorder: false,
    isOutOfStock: false,
    createdBy: 'system@company.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-17T13:15:00Z'
  },
  {
    id: 2,
    sparePartId: 2,
    sparePartName: 'Power Supply Unit',
    sparePartModel: 'PSU-500W',
    quantityInStock: 25,
    minimumStockLevel: 30,
    maximumStockLevel: 100,
    reorderPoint: 35,
    unitCost: 16.00,
    warehouseLocation: 'G7-H8',
    notes: '500W power supply units',
    isLowStock: true,
    needsReorder: true,
    isOutOfStock: false,
    createdBy: 'jane.manager@company.com',
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-17T11:45:00Z'
  }
]

export const mockInventoryTransactions: InventoryTransaction[] = [
  {
    id: 1,
    transactionNumber: 'TXN-A1B2C3D4',
    transactionType: 'IMPORT',
    itemType: 'DEVICE',
    itemId: 1,
    itemName: 'Network Switch 24-Port',
    quantity: 10,
    unitPrice: 300.00,
    totalAmount: 3000.00,
    supplierId: 1,
    supplierName: 'Tech Supplies Inc.',
    referenceNumber: 'PO-2024-001',
    referenceType: 'IMPORT',
    referenceId: 1,
    transactionReason: 'Regular stock replenishment',
    notes: 'High-quality network switches for enterprise use',
    warehouseLocation: 'A1-B2',
    createdBy: 'john.doe@company.com',
    createdAt: '2024-01-17T14:30:00Z',
    updatedAt: '2024-01-17T14:30:00Z',
    isImport: true,
    isExport: false,
    isAdjustment: false,
    isDevice: true,
    isSparePart: false
  },
  {
    id: 2,
    transactionNumber: 'TXN-E5F6G7H8',
    transactionType: 'EXPORT',
    itemType: 'SPARE_PART',
    itemId: 1,
    itemName: 'Network Cable Cat6',
    quantity: 50,
    unitPrice: 2.99,
    totalAmount: 149.50,
    supplierId: null as unknown as number,
    supplierName: null as unknown as string,
    referenceNumber: 'TASK-2024-001',
    referenceType: 'TASK',
    referenceId: 101,
    transactionReason: 'Technician export for maintenance task',
    notes: 'Used for network installation at client site',
    warehouseLocation: 'E5-F6',
    createdBy: 'tech.smith@company.com',
    createdAt: '2024-01-17T13:15:00Z',
    updatedAt: '2024-01-17T13:15:00Z',
    isImport: false,
    isExport: true,
    isAdjustment: false,
    isDevice: false,
    isSparePart: true
  }
]

export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Tech Supplies Inc.',
    email: 'sales@techsupplies.com',
    phone: '+1-555-0123',
    address: '123 Tech Street, Silicon Valley, CA',
    suppliesDevices: true,
    suppliesSpareParts: true,
    isActive: true
  },
  {
    id: 2,
    name: 'Network Solutions Ltd.',
    email: 'info@networksolutions.com',
    phone: '+1-555-0456',
    address: '456 Network Ave, Tech City, TX',
    suppliesDevices: true,
    suppliesSpareParts: false,
    isActive: true
  },
  {
    id: 3,
    name: 'Component Warehouse',
    email: 'orders@componentwarehouse.com',
    phone: '+1-555-0789',
    address: '789 Component Blvd, Parts Town, FL',
    suppliesDevices: false,
    suppliesSpareParts: true,
    isActive: true
  }
]

export const mockSupplierDeviceTypes: SupplierDeviceType[] = [
  {
    id: 1,
    supplierId: 1,
    deviceType: 'Network Switch',
    deviceModel: '24-Port',
    isActive: true
  },
  {
    id: 2,
    supplierId: 1,
    deviceType: 'Wireless Router',
    deviceModel: 'AC1200',
    isActive: true
  },
  {
    id: 3,
    supplierId: 1,
    deviceType: 'Network Attached Storage',
    deviceModel: '2TB',
    isActive: true
  },
  {
    id: 4,
    supplierId: 2,
    deviceType: 'Security Camera',
    deviceModel: '4K',
    isActive: true
  },
  {
    id: 5,
    supplierId: 2,
    deviceType: 'Firewall Appliance',
    deviceModel: '1000',
    isActive: true
  }
]

export const mockInventoryStats: InventoryStats = {
  totalDevices: 25,
  totalSpareParts: 150,
  lowStockDevices: 3,
  lowStockSpareParts: 7,
  outOfStockDevices: 2,
  outOfStockSpareParts: 5,
  totalValue: 125000,
  lowStockValue: 5000
}
