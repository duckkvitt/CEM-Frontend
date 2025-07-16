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
import { getAccessToken, getCurrentUserRole } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Schema definition using Zod
const formSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[+]?[0-9]{10,20}$/, 'Invalid phone number format'),
  address: z.string().max(1000).optional(),
  companyName: z.string().min(1, 'Company name is required').max(255),
  companyTaxCode: z.string().min(1, 'Company tax code is required').max(50),
  companyAddress: z.string().min(1, 'Company address is required').max(1000),
  legalRepresentative: z
    .string()
    .min(1, 'Legal representative is required')
    .max(255),
  title: z.string().min(1, 'Title is required').max(255),
  identityNumber: z.string().min(1, 'Identity number is required').max(50),
  identityIssueDate: z.date({
    required_error: 'Identity issue date is required.',
  }),
  identityIssuePlace: z
    .string()
    .min(1, 'Identity issue place is required')
    .max(255),
  fax: z.string().max(20).optional(),
  tags: z.string().optional(),
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
      const payload = {
        ...values,
        name: values.legalRepresentative, // Use legalRepresentative as the main name
        // Format date and handle optional fields
        identityIssueDate: format(values.identityIssueDate, 'yyyy-MM-dd'),
        tags: values.tags
          ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        address: values.address || undefined,
        companyName: values.companyName || undefined,
        companyTaxCode: values.companyTaxCode || undefined,
        companyAddress: values.companyAddress || undefined,
        fax: values.fax || undefined,
      }

      const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
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
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
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
                <CardTitle>Thông tin Người đại diện</CardTitle>
                <CardDescription>
                  Thông tin cá nhân của người đại diện theo pháp luật.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="legalRepresentative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Người đại diện (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn Văn A" {...field} />
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
                      <FormLabel>Chức danh (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="Giám đốc" {...field} />
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
                      <FormLabel>CMND/CCCD/Hộ chiếu số (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="0123456789" {...field} />
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
                      <FormLabel>Nơi cấp (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="Cục CSQLHC về TTXH" {...field} />
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
                      <FormLabel>Ngày cấp (*)</FormLabel>
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
                                <span>Pick a date</span>
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
                      <FormLabel>Số điện thoại (*)</FormLabel>
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
                      <FormLabel>Email (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="example@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin Doanh nghiệp</CardTitle>
                <CardDescription>
                  Thông tin pháp lý và liên lạc của doanh nghiệp (nếu có).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên Khách hàng/Doanh nghiệp (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="Công ty TNHH ABC" {...field} />
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
                      <FormLabel>Mã số doanh nghiệp (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="0102030405" {...field} />
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
                      <FormLabel>Địa chỉ trụ sở chính (*)</FormLabel>
                      <FormControl>
                        <Input placeholder="Số 1, Đường ABC, Phường XYZ, Quận 1, TP. HCM" {...field} />
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
                      <FormLabel>Fax</FormLabel>
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
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="vip, new-customer" {...field} />
                      </FormControl>
                       <FormDescription>
                        Phân cách bằng dấu phẩy.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {error && <p className='text-destructive text-sm font-medium'>{error}</p>}
            {success && <p className='text-green-600 text-sm font-medium'>{success}</p>}
            
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground">
                <p>Form valid: {form.formState.isValid ? 'Yes' : 'No'}</p>
                {Object.keys(form.formState.errors).length > 0 && (
                  <p>Errors: {Object.keys(form.formState.errors).join(', ')}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4">
               <Button type="button" variant="outline" onClick={() => router.push('/customers')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !form.formState.isValid}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Customer
              </Button>
          </div>
          </form>
        </Form>
          </div>
      </main>
  )
} 