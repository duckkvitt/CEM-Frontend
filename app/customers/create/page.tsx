'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout, getCurrentUserRole  } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Comprehensive validation schema with business logic
const formSchema = z.object({
  // Legal Representative Information
  legalRepresentative: z
    .string()
    .min(1, 'Legal representative name is required')
    .min(2, 'Legal representative name must be at least 2 characters')
    .max(255, 'Legal representative name cannot exceed 255 characters')
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Legal representative name can only contain letters and spaces')
    .refine((val) => val.trim().length > 0, 'Legal representative name cannot be empty or only spaces'),

  title: z
    .string()
    .min(1, 'Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Title can only contain letters and spaces')
    .refine((val) => val.trim().length > 0, 'Title cannot be empty or only spaces'),

  identityNumber: z
    .string()
    .min(1, 'Identity number is required')
    .min(9, 'Identity number must be at least 9 digits')
    .max(20, 'Identity number cannot exceed 20 characters')
    .regex(/^[0-9]+$/, 'Identity number can only contain digits')
    .refine((val) => val.trim().length > 0, 'Identity number cannot be empty or only spaces'),

  identityIssuePlace: z
    .string()
    .min(1, 'Identity issue place is required')
    .min(2, 'Identity issue place must be at least 2 characters')
    .max(255, 'Identity issue place cannot exceed 255 characters')
    .refine((val) => val.trim().length > 0, 'Identity issue place cannot be empty or only spaces'),

  identityIssueDate: z
    .date({
      required_error: 'Identity issue date is required',
      invalid_type_error: 'Please select a valid date',
    })
    .refine((date) => {
      const today = new Date()
      const minDate = new Date('1900-01-01')
      return date <= today && date >= minDate
    }, 'Identity issue date must be between 1900 and today')
    .refine((date) => {
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 36500 // 100 years
    }, 'Identity issue date cannot be more than 100 years ago'),

  // Contact Information
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^(\+84|84|0)[0-9]{9,10}$/, 'Please enter a valid Vietnamese phone number (e.g., +84123456789, 0123456789)')
    .refine((val) => val.trim().length > 0, 'Phone number cannot be empty or only spaces'),

  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g., user@example.com)')
    .max(255, 'Email address cannot exceed 255 characters')
    .toLowerCase()
    .refine((val) => val.trim().length > 0, 'Email address cannot be empty or only spaces')
    .refine((val) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      return emailRegex.test(val)
    }, 'Please enter a valid email format'),

  address: z
    .string()
    .max(1000, 'Address cannot exceed 1000 characters')
    .optional()
    .refine((val) => !val || val.trim().length > 0, 'Address cannot be only spaces'),

  // Company Information
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name cannot exceed 255 characters')
    .refine((val) => val.trim().length > 0, 'Company name cannot be empty or only spaces')
    .refine((val) => {
      // Allow letters, numbers, spaces, and common business characters
      const businessNameRegex = /^[a-zA-ZÀ-ỹ0-9\s\-\.&(),]+$/
      return businessNameRegex.test(val)
    }, 'Company name contains invalid characters'),

  companyTaxCode: z
    .string()
    .min(1, 'Company tax code is required')
    .min(10, 'Company tax code must be at least 10 digits')
    .max(15, 'Company tax code cannot exceed 15 digits')
    .regex(/^[0-9]+$/, 'Company tax code can only contain digits')
    .refine((val) => val.trim().length > 0, 'Company tax code cannot be empty or only spaces')
    .refine((val) => {
      // Vietnamese tax code validation (usually 10-13 digits)
      return val.length >= 10 && val.length <= 13
    }, 'Company tax code must be between 10-13 digits'),

  companyAddress: z
    .string()
    .min(1, 'Company address is required')
    .min(10, 'Company address must be at least 10 characters')
    .max(1000, 'Company address cannot exceed 1000 characters')
    .refine((val) => val.trim().length > 0, 'Company address cannot be empty or only spaces')
    .refine((val) => {
      // Basic address validation - should contain at least one number and some text
      const hasNumber = /\d/.test(val)
      const hasText = /[a-zA-ZÀ-ỹ]/.test(val)
      return hasNumber && hasText
    }, 'Please enter a complete address with street number and name'),

  // Optional fields
  fax: z
    .string()
    .max(20, 'Fax number cannot exceed 20 characters')
    .optional()
    .refine((val) => !val || val.trim().length > 0, 'Fax number cannot be only spaces')
    .refine((val) => {
      if (!val) return true
      // Basic fax validation - should contain numbers and optional + or -
      const faxRegex = /^[\+]?[0-9\-\s\(\)]+$/
      return faxRegex.test(val)
    }, 'Please enter a valid fax number'),

  tags: z
    .string()
    .max(500, 'Tags cannot exceed 500 characters')
    .optional()
    .refine((val) => !val || val.trim().length > 0, 'Tags cannot be only spaces')
    .refine((val) => {
      if (!val) return true
      // Validate tag format - should be comma-separated, no special characters
      const tags = val.split(',').map(tag => tag.trim()).filter(Boolean)
      return tags.every(tag => /^[a-zA-Z0-9\-\s]+$/.test(tag) && tag.length <= 50)
    }, 'Tags must be comma-separated and contain only letters, numbers, hyphens, and spaces (max 50 chars per tag)'),
})

type FormValues = z.infer<typeof formSchema>

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: unknown
}

export default function CreateCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange', // Re-validate on change
    defaultValues: {
      email: '',
      phone: '',
      address: '',
      companyName: '',
      companyTaxCode: '',
      companyAddress: '',
      legalRepresentative: '',
      title: '',
      identityNumber: '',
      identityIssuePlace: '',
      fax: '',
      tags: '',
    },
  })

  useEffect(() => {
    const role = getCurrentUserRole()
    if (role && role !== 'STAFF') {
      router.replace('/dashboard')
    }
  }, [router])

  const onSubmit = async (values: FormValues) => {
    console.log('Form submitted with values:', values)
    console.log('Form errors:', form.formState.errors)
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Additional client-side validation before submission
      if (!values.identityIssueDate) {
        throw new Error('Identity issue date is required')
      }
      
      // Validate that identity issue date is not in the future
      if (values.identityIssueDate > new Date()) {
        throw new Error('Identity issue date cannot be in the future')
      }

      const payload = {
        ...values,
        name: values.legalRepresentative.trim(), // Use legalRepresentative as the main name
        // Format date and handle optional fields
        identityIssueDate: format(values.identityIssueDate, 'yyyy-MM-dd'),
        tags: values.tags
          ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        address: values.address?.trim() || undefined,
        companyName: values.companyName?.trim() || undefined,
        companyTaxCode: values.companyTaxCode?.trim() || undefined,
        companyAddress: values.companyAddress?.trim() || undefined,
        fax: values.fax?.trim() || undefined,
        // Clean up other fields
        legalRepresentative: values.legalRepresentative.trim(),
        title: values.title.trim(),
        identityNumber: values.identityNumber.trim(),
        identityIssuePlace: values.identityIssuePlace.trim(),
        phone: values.phone.trim(),
        email: values.email.trim().toLowerCase(),
      }

      const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getValidAccessToken()}`,
        },
        body: JSON.stringify(payload),
      })

      const json: ApiResponse<unknown> = await res.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to create customer')
      }
      setSuccess('Customer created successfully! Redirecting...')
      setTimeout(() => router.push('/customers'), 2000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Form submission error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-muted/40 p-4">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Create New Customer</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Legal Representative Information</CardTitle>
                <CardDescription>
                  Personal information of the legal representative according to law.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="legalRepresentative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Representative Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title/Position *</FormLabel>
                      <FormControl>
                        <Input placeholder="CEO, Director, Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="identityNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID/Passport Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="identityIssuePlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issued By *</FormLabel>
                      <FormControl>
                        <Input placeholder="Department of Immigration" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="identityIssueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date *</FormLabel>
                       <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Select issue date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+84123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="john.smith@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Legal and contact information of the company.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Company Ltd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyTaxCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="0123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Company Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street, District 1, Ho Chi Minh City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Personal Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="456 Personal Street, District 2, Ho Chi Minh City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+84-28-12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="vip, new-customer, priority" {...field} />
                      </FormControl>
                       <FormDescription>
                        Separate multiple tags with commas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {error && <p className='text-destructive text-sm font-medium'>{error}</p>}
            {success && <p className='text-green-600 text-sm font-medium'>{success}</p>}
            
            {/* Validation Summary - Development only */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm">Validation Status</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Form Valid: {form.formState.isValid ? '✅ Yes' : '❌ No'}</p>
                  <p>Fields Touched: {Object.keys(form.formState.touchedFields).length}</p>
                  <p>Fields with Errors: {Object.keys(form.formState.errors).length}</p>
                  {Object.keys(form.formState.errors).length > 0 && (
                    <div>
                      <p className="font-medium text-destructive">Errors:</p>
                      <ul className="list-disc list-inside ml-2">
                        {Object.entries(form.formState.errors).map(([field, error]) => (
                          <li key={field}>
                            <span className="font-medium">{field}:</span> {error?.message || 'Invalid'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-4">
               <Button type="button" variant="outline" onClick={() => router.push('/customers')}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !form.formState.isValid || form.formState.isSubmitting}
                className="min-w-[140px]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Creating...' : 'Create Customer'}
              </Button>
          </div>
          </form>
        </Form>
          </div>
      </main>
  )
} 