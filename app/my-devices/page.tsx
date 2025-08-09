'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DEVICE_SERVICE_URL } from '@/lib/api'
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Search, Filter, Package, AlertTriangle, CheckCircle, Clock, Settings, Shield } from 'lucide-react'
import { getContractsForCurrentUser, type ContractResponse } from '@/lib/contract-service'
import { useCallback } from 'react'

interface CustomerDevice {
  id: number
  customerId: number
  contractId?: number
  deviceId: number
  deviceName: string
  deviceModel?: string
  serialNumber?: string
  devicePrice?: number
  deviceUnit?: string
  customerDeviceCode?: string
  warrantyEnd?: string
  status: string
  warrantyExpired: boolean
  warrantyExpiringSoon: boolean
  createdAt: string
  updatedAt: string
}

interface DeviceStatistics {
  totalDevices: number
  activeDevices: number
  maintenanceDevices: number
  brokenDevices: number
  expiredWarrantyDevices: number
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  status?: number
  errors?: unknown
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

  const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'ERROR', label: 'Error' },
    { value: 'WARRANTY', label: 'Warranty' },
    { value: 'EXPIRED', label: 'Expired' }
  ]

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  ERROR: 'bg-red-100 text-red-800',
  WARRANTY: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-orange-100 text-orange-800'
}

const STATUS_ICONS = {
  ACTIVE: CheckCircle,
  INACTIVE: Settings,
  ERROR: AlertTriangle,
  WARRANTY: Shield,
  EXPIRED: Clock
}

export default function MyDevicesPage() {
  const [devices, setDevices] = useState<CustomerDevice[]>([])
  const [statistics, setStatistics] = useState<DeviceStatistics | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [warrantyExpired, setWarrantyExpired] = useState<boolean | null>(null)
  const [contractId, setContractId] = useState<string>('ALL')
  const [page, setPage] = useState(0)
  const [size] = useState(12)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [contracts, setContracts] = useState<ContractResponse[]>([])
  const router = useRouter()

  useEffect(() => {
    setRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    if (role && role !== 'CUSTOMER') {
      router.replace('/dashboard')
    }
  }, [role, router])

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.append('keyword', search)
      if (status && status !== 'ALL') params.append('status', status)
      if (warrantyExpired !== null) params.append('warrantyExpired', warrantyExpired.toString())
      if (contractId && contractId !== 'ALL') params.append('contractId', contractId)
      params.append('page', page.toString())
      params.append('size', size.toString())
      
      const url = `${DEVICE_SERVICE_URL}/customer-devices?${params.toString()}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        cache: 'no-store'
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const json: ApiResponse<Page<CustomerDevice>> = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to fetch devices')
      
      setDevices(json.data.content)
      setTotalPages(json.data.totalPages)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [search, status, warrantyExpired, contractId, page, size])

  const fetchStatistics = async () => {
    try {
      const url = `${DEVICE_SERVICE_URL}/customer-devices/statistics`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        cache: 'no-store'
      })
      
      if (res.ok) {
        const json: ApiResponse<DeviceStatistics> = await res.json()
        if (json.success) {
          setStatistics(json.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  useEffect(() => {
    if (role === 'CUSTOMER') {
      fetchDevices()
      // load contracts for filter options
      getContractsForCurrentUser().then(setContracts).catch(() => {})
      fetchStatistics()
    }
  }, [page, size, role, fetchDevices])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchDevices()
  }

  const handleReset = () => {
    setSearch('')
    setStatus('ALL')
    setWarrantyExpired(null)
    setPage(0)
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getWarrantyStatus = (device: CustomerDevice) => {
    if (device.warrantyExpired) {
      return { text: 'Warranty Expired', color: 'text-red-600', icon: AlertTriangle }
    }
    if (device.warrantyExpiringSoon) {
      return { text: 'Warranty Expiring Soon', color: 'text-yellow-600', icon: Clock }
    }
    return { text: 'Under Warranty', color: 'text-green-600', icon: CheckCircle }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  // Group devices by contract to render a big contract card containing small device cards
  const groupedByContract = useMemo(() => {
    const map = new Map<string, CustomerDevice[]>()
    devices.forEach(d => {
      const key = d.contractId !== undefined ? String(d.contractId) : 'NO_CONTRACT'
      const list = map.get(key) ?? []
      list.push(d)
      map.set(key, list)
    })

    const groups = Array.from(map.entries()).map(([key, list]) => {
      const id = key === 'NO_CONTRACT' ? undefined : Number(key)
      const contract = id ? contracts.find(c => c.id === id) : undefined
      return { key, contractId: id, contract, devices: list }
    })

    // Sort: contracts with id first (ascending), then unassigned
    groups.sort((a, b) => {
      if (a.contractId === undefined && b.contractId !== undefined) return 1
      if (a.contractId !== undefined && b.contractId === undefined) return -1
      if (a.contractId === undefined && b.contractId === undefined) return 0
      return (a.contractId ?? 0) - (b.contractId ?? 0)
    })

    return groups
  }, [devices, contracts])

  if (role && role !== 'CUSTOMER') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Purchased Devices</h1>
        <p className="text-gray-600">View and manage all your purchased devices</p>
      </motion.div>

      {/* Statistics Cards */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Total Devices</p>
                  <p className="text-2xl font-bold text-blue-900">{statistics.totalDevices}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Active</p>
                  <p className="text-2xl font-bold text-green-900">{statistics.activeDevices}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.maintenanceDevices}</p>
                </div>
                <Settings className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Error</p>
                  <p className="text-2xl font-bold text-red-900">{statistics.brokenDevices}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Expired Warranty</p>
                  <p className="text-2xl font-bold text-orange-900">{statistics.expiredWarrantyDevices}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Device name, model, serial..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="warranty">Warranty</Label>
                <Select 
                  value={warrantyExpired === null ? 'ALL' : warrantyExpired.toString()} 
                  onValueChange={(value) => setWarrantyExpired(value === 'ALL' ? null : value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="true">Expired</SelectItem>
                    <SelectItem value="false">Valid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contract">Contract</Label>
                <Select 
                  value={contractId}
                  onValueChange={(value) => setContractId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Contracts" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Contracts</SelectItem>
                      {contracts.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          #{c.id} — {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">
                  Apply Filters
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Contract Groups -> each big card contains small device cards */}
      {loading ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6"
        >
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/5" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((__, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-5 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
          <p className="text-gray-500">You haven't purchased any devices yet.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6"
        >
          {groupedByContract.map(group => (
            <motion.div key={group.key} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">
                        {group.contractId !== undefined
                          ? `Contract #${group.contractId}`
                          : 'Unassigned Devices'}
                      </CardTitle>
                      <CardDescription>
                        {group.contract
                          ? `${group.contract.title} • ${group.contract.contractNumber}`
                          : 'Devices not linked to any contract'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{group.devices.length} devices</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.devices.map(device => {
                      const StatusIcon = STATUS_ICONS[device.status as keyof typeof STATUS_ICONS] || CheckCircle
                      const warrantyStatus = getWarrantyStatus(device)
                      const WarrantyIcon = warrantyStatus.icon
                      return (
                        <motion.div key={device.id} variants={itemVariants}>
                          <Card
                            className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                            onClick={() => router.push(`/my-devices/${device.id}`)}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg mb-1">{device.deviceName}</CardTitle>
                                  {device.customerDeviceCode && (
                                    <div className="text-xs text-gray-500 font-mono">Code: {device.customerDeviceCode}</div>
                                  )}
                                  <CardDescription>
                                    {device.deviceModel && `${device.deviceModel}`}
                                    {device.serialNumber && ` • SN: ${device.serialNumber}`}
                                  </CardDescription>
                                </div>
                                <Badge className={STATUS_COLORS[device.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {device.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Price:</span>
                                  <span className="font-medium">{formatPrice(device.devicePrice)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Warranty:</span>
                                  <div className="flex items-center gap-1">
                                    <WarrantyIcon className={`h-4 w-4 ${warrantyStatus.color}`} />
                                    <span className={`text-sm ${warrantyStatus.color}`}>{warrantyStatus.text}</span>
                                  </div>
                                </div>
                                {device.warrantyEnd && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Warranty Until:</span>
                                    <span className="text-sm">{formatDate(device.warrantyEnd)}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Purchased:</span>
                                  <span className="text-sm">{formatDate(device.createdAt)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-between mt-8"
        >
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
} 