'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  Eye, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { getTechniciansForAssignment, initializeTechnicianProfiles } from '@/lib/task-service'

interface TechnicianInfo {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  location?: string
  skills?: string
  currentTaskCount: number
  totalTaskCount: number
  completedTaskCount: number
  averageRating: number
  isAvailable: boolean
  workloadPercentage: number
  availabilityStatus: string
  maxConcurrentTasks: number
  completionRate: number
  averageCompletionDays: number
  lastActiveDate?: string
}

const availabilityColors = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  BUSY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OVERLOADED: 'bg-red-100 text-red-800 border-red-200',
  UNAVAILABLE: 'bg-gray-100 text-gray-800 border-gray-200'
}

const availabilityIcons = {
  AVAILABLE: <CheckCircle2 className="h-4 w-4" />,
  BUSY: <Clock className="h-4 w-4" />,
  OVERLOADED: <AlertCircle className="h-4 w-4" />,
  UNAVAILABLE: <User className="h-4 w-4" />
}

export default function TechLeadTechniciansPage() {
  const router = useRouter()
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initializingProfiles, setInitializingProfiles] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL')
  const [locationFilter, setLocationFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('workloadPercentage')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Role-based access control
  useEffect(() => {
    const userRole = getCurrentUserRole()
    if (!userRole || !['LEAD_TECH', 'ADMIN'].includes(userRole)) {
      router.push('/dashboard')
      return
    }
  }, [router])

  // Load technicians data
  useEffect(() => {
    loadTechnicians()
  }, [])

  const loadTechnicians = async () => {
    try {
      setLoading(true)
      // Get real technicians data from backend
      const techniciansList = await getTechniciansForAssignment()
      
      // Use real technicians data from backend
      const enhancedTechnicians: TechnicianInfo[] = techniciansList

      setTechnicians(enhancedTechnicians)
      setError(null)
    } catch (err) {
      setError('Failed to load technicians')
      console.error('Failed to load technicians:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInitializeProfiles = async () => {
    try {
      setInitializingProfiles(true)
      const result = await initializeTechnicianProfiles()
      
      // Reload technicians data after initialization
      await loadTechnicians()
      
      setError(null)
      // You could show a success toast here
      console.log('Profiles initialized:', result)
    } catch (err) {
      console.error('Failed to initialize profiles:', err)
      setError('Failed to initialize technician profiles')
    } finally {
      setInitializingProfiles(false)
    }
  }

  // Filter and sort technicians
  const filteredTechnicians = technicians
    .filter(tech => {
      const matchesSearch = searchTerm === '' || 
        `${tech.firstName} ${tech.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesAvailability = availabilityFilter === 'ALL' || tech.availabilityStatus === availabilityFilter
      const matchesLocation = locationFilter === 'ALL' || tech.location === locationFilter
      
      return matchesSearch && matchesAvailability && matchesLocation
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`
          bValue = `${b.firstName} ${b.lastName}`
          break
        case 'workloadPercentage':
          aValue = a.workloadPercentage
          bValue = b.workloadPercentage
          break
        case 'activeTasks':
          aValue = a.currentTaskCount
          bValue = b.currentTaskCount
          break
        case 'completedTasks':
          aValue = a.completedTaskCount
          bValue = b.completedTaskCount
          break
        case 'availability':
          aValue = a.availabilityStatus
          bValue = b.availabilityStatus
          break
        default:
          aValue = a.workloadPercentage
          bValue = b.workloadPercentage
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const clearFilters = () => {
    setSearchTerm('')
    setAvailabilityFilter('ALL')
    setLocationFilter('ALL')
  }

  const getAvailabilityDescription = (availabilityStatus: string, workloadPercentage: number) => {
    switch (availabilityStatus) {
      case 'AVAILABLE':
        return 'Ready for new assignments'
      case 'BUSY':
        return 'Currently working on tasks but can take more'
      case 'OVERLOADED':
        return 'At maximum capacity, avoid new assignments'
      case 'UNAVAILABLE':
        return 'Not available for assignments'
      default:
        return 'Status unknown'
    }
  }

  const getWorkloadColor = (workloadPercentage: number) => {
    if (workloadPercentage <= 30) return 'text-green-600'
    if (workloadPercentage <= 60) return 'text-yellow-600'
    if (workloadPercentage <= 80) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <main className="ml-64 flex-1 bg-background p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full">
      <main className="ml-64 flex-1 bg-background p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Technician Management</h1>
              <p className="text-muted-foreground">
                Monitor technician availability and workload for efficient task assignment
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleInitializeProfiles}
                disabled={initializingProfiles}
                variant="outline"
                className="flex items-center gap-2"
              >
                {initializingProfiles ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Initializing...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Initialize Profiles
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Technicians</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{technicians.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {technicians.filter(t => t.availabilityStatus === 'AVAILABLE').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Busy</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {technicians.filter(t => t.availabilityStatus === 'BUSY').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overloaded</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {technicians.filter(t => t.availabilityStatus === 'OVERLOADED').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search technicians..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="BUSY">Busy</SelectItem>
                      <SelectItem value="OVERLOADED">Overloaded</SelectItem>
                      <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All locations</SelectItem>
                      <SelectItem value="Downtown">Downtown</SelectItem>
                      <SelectItem value="Uptown">Uptown</SelectItem>
                      <SelectItem value="West Side">West Side</SelectItem>
                      <SelectItem value="East Side">East Side</SelectItem>
                      <SelectItem value="North District">North District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="workloadPercentage">Workload</SelectItem>
                      <SelectItem value="activeTasks">Active Tasks</SelectItem>
                      <SelectItem value="completedTasks">Completed Tasks</SelectItem>
                      <SelectItem value="availability">Availability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Technicians Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTechnicians.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No technicians found</h3>
                    <p className="text-muted-foreground text-center">
                      No technicians match your current filters. Try adjusting your search criteria.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredTechnicians.map((technician, index) => (
                <motion.div
                  key={technician.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                            {technician.firstName[0]}{technician.lastName[0]}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {technician.firstName} {technician.lastName}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {technician.email}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={availabilityColors[technician.availabilityStatus as keyof typeof availabilityColors]}
                        >
                          <span className="flex items-center gap-1">
                            {availabilityIcons[technician.availabilityStatus as keyof typeof availabilityIcons]}
                            {technician.availabilityStatus}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {technician.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{technician.phone}</span>
                          </div>
                        )}
                        {technician.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{technician.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {technician.skills && typeof technician.skills === 'string' && technician.skills.trim() && (
                        <div>
                          <Label className="text-xs font-medium">Skills</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {technician.skills.split(', ')
                              .filter(skill => skill.trim()) // Filter out empty skills
                              .map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Workload */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium">Workload</Label>
                          <span className={`text-xs font-medium ${getWorkloadColor(technician.workloadPercentage)}`}>
                            {technician.workloadPercentage}%
                          </span>
                        </div>
                        <Progress value={technician.workloadPercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {getAvailabilityDescription(technician.availabilityStatus, technician.workloadPercentage)}
                        </p>
                      </div>

                      {/* Task Statistics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{technician.currentTaskCount}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{technician.completedTaskCount}</div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{technician.totalTaskCount}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-sm font-bold text-purple-600">{technician.completionRate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Completion Rate</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-orange-600">{technician.averageCompletionDays} days</div>
                          <div className="text-xs text-muted-foreground">Avg. Completion</div>
                        </div>
                      </div>

                      {/* Last Active */}
                      {technician.lastActiveDate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Last active: {format(new Date(technician.lastActiveDate), 'MMM dd, HH:mm')}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-2"
                          onClick={() => router.push(`/techlead/tasks?assignTo=${technician.id}`)}
                        >
                          <Briefcase className="h-4 w-4" />
                          Assign Tasks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
