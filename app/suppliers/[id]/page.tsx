'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Mail, Phone, FileText as Fax, Globe, Building, MapPin, FileText, Package, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { getSupplierById, deleteSupplier } from '@/lib/supplier-service'
import { getCurrentUserRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MotionDiv } from '@/components/motion-div'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Supplier, SupplierStatus } from '@/types/supplier'
import Link from 'next/link'

interface Props {
  params: Promise<{
    id: string
  }>
}

const STATUS_CONFIGS = {
  ACTIVE: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Active'
  },
  INACTIVE: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Clock,
    label: 'Inactive'
  },
  SUSPENDED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    label: 'Suspended'
  }
} as const

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

export default function SupplierDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setUserRole(getCurrentUserRole())
  }, [])

  useEffect(() => {
    async function fetchSupplier() {
      try {
        setLoading(true)
        const data = await getSupplierById(parseInt(resolvedParams.id))
        setSupplier(data)
      } catch (err) {
        console.error('Error fetching supplier:', err)
        setError(err instanceof Error ? err.message : 'Failed to load supplier details')
      } finally {
        setLoading(false)
      }
    }

    if (resolvedParams.id) {
      fetchSupplier()
    }
  }, [resolvedParams.id])

  const handleDelete = async () => {
    if (!supplier) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.companyName}"? This action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      setDeleting(true)
      await deleteSupplier(supplier.id)
      toast.success('Supplier deleted successfully')
      router.push('/suppliers')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete supplier'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  // Show access denied for non-manager users
  if (userRole && userRole !== 'MANAGER' && userRole !== 'STAFF') {
    return (
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6"
      >
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Access denied. Only managers and staff can view supplier details.
          </AlertDescription>
        </Alert>
      </MotionDiv>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6"
      >
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </MotionDiv>
    )
  }

  if (!supplier) {
    return (
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6"
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Supplier not found.
          </AlertDescription>
        </Alert>
      </MotionDiv>
    )
  }

  const statusConfig = STATUS_CONFIGS[supplier.status]
  const StatusIcon = statusConfig.icon

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="transition-all duration-200 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-bold text-2xl md:text-3xl text-gray-900">
              {supplier.companyName}
            </h1>
            <Badge 
              className={`${statusConfig.color} border font-medium px-3 py-1 flex items-center gap-1.5`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-gray-600">{supplier.contactPerson}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            asChild
            className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
          >
            <Link href={`/suppliers/${supplier.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Company Information */}
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <Card className="h-full transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-blue-600" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Company Name</p>
                    <p className="text-gray-900 font-medium">{supplier.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Contact Person</p>
                    <p className="text-gray-900">{supplier.contactPerson}</p>
                  </div>
                  {supplier.taxCode && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Tax Code</p>
                      <p className="text-gray-900 font-mono text-sm">{supplier.taxCode}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {supplier.businessLicense && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Business License</p>
                      <p className="text-gray-900 font-mono text-sm">{supplier.businessLicense}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <Badge className={`${statusConfig.color} border font-medium flex items-center gap-1.5 w-fit`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>
              {supplier.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900 leading-relaxed">{supplier.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div variants={cardVariants}>
          <Card className="h-full transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-green-600" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <a 
                      href={`mailto:${supplier.email}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      {supplier.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500">Phone</p>
                    <a 
                      href={`tel:${supplier.phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                </div>

                {supplier.fax && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Fax className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Fax</p>
                      <p className="text-gray-900 font-mono">{supplier.fax}</p>
                    </div>
                  </div>
                )}

                {supplier.website && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Globe className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Website</p>
                      <a 
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Address */}
        <motion.div variants={cardVariants}>
          <Card className="h-full transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-red-600" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 leading-relaxed whitespace-pre-line">
                  {supplier.address}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spare Part Types */}
        <motion.div variants={cardVariants}>
          <Card className="h-full transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-purple-600" />
                Spare Part Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supplier.spareParts && supplier.spareParts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {supplier.spareParts.map((sparePart) => (
                    <Badge 
                      key={sparePart.id} 
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors duration-200"
                    >
                      {sparePart.partName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No spare parts specified</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Timestamps */}
        <motion.div variants={cardVariants}>
          <Card className="h-full transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-gray-900">{formatDate(supplier.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                  <p className="text-gray-900">{formatDate(supplier.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MotionDiv>
  )
}