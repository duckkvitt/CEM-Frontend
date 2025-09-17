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
import { Skeleton } from '@/components/ui/skeleton'
import { CUSTOMER_SERVICE_URL } from '@/lib/api'
import { getValidAccessToken, logout, getCurrentUserRole  } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Schema for edit is similar, but all fields can be optional for partial updates
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format').max(255),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[+]?[0-9]{10,20}$/, 'Invalid phone number format'),
  address: z.string().max(1000).optional().nullable(),
  companyName: z.string().max(255).optional().nullable(),
  companyTaxCode: z.string().max(50).optional().nullable(),
  companyAddress: z.string().max(1000).optional().nullable(),
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
  fax: z.string().max(20).optional().nullable(),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    companyName: string | null;
    companyTaxCode: string | null;
    companyAddress: string | null;
    legalRepresentative: string;
    title: string;
    identityNumber: string;
    identityIssueDate: string; // Comes as ISO string
    identityIssuePlace: string;
    fax: string | null;
    tags: string[];
}


interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: unknown
}

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true) // For initial data fetch
  const [saving, setSaving] = useState(false) // For form submission
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {}, // Will be populated from API
  })

  useEffect(() => {
    const role = getCurrentUserRole()
    if (role && role !== 'STAFF') {
      router.replace('/dashboard')
    }
  }, [router])
  
  useEffect(() => {
    if (!id) return;
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers/${id}`, {
          headers: { Authorization: `Bearer ${await getValidAccessToken()}` },
          cache: 'no-store'
        });
        const json: ApiResponse<Customer> = await res.json();
        if (!json.success || !json.data) throw new Error(json.message || 'Failed to fetch customer data');

        // Populate form with fetched data
        form.reset({
            ...json.data,
            identityIssueDate: parseISO(json.data.identityIssueDate), // Convert string to Date
            tags: json.data.tags?.join(', ') || ''
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id, form]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        ...values,
        identityIssueDate: format(values.identityIssueDate, 'yyyy-MM-dd'),
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        // Handle optional fields that could be empty strings
        address: values.address || undefined,
        companyName: values.companyName || undefined,
        companyTaxCode: values.companyTaxCode || undefined,
        companyAddress: values.companyAddress || undefined,
        fax: values.fax || undefined,
      };

      const res = await fetch(`${CUSTOMER_SERVICE_URL}/v1/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getValidAccessToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const json: ApiResponse<unknown> = await res.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to update customer')
      }
      setSuccess('Customer updated successfully! Redirecting...')
      setTimeout(() => router.push('/customers'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
         <main className="flex min-h-screen w-full flex-col items-center bg-muted/40 p-4">
             <div className="w-full max-w-4xl space-y-8">
                <Skeleton className="h-10 w-64"/>
                <Skeleton className="h-96 w-full"/>
                <Skeleton className="h-96 w-full"/>
             </div>
         </main>
    )
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-muted/40 p-4">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Customer: {form.getValues().name}</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Representative Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 {/* Fields are identical to create form, just pre-populated */}
                 <FormField control={form.control} name="legalRepresentative" render={({ field }) => ( <FormItem><FormLabel>Representative Name (*)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Job Title (*)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="identityNumber" render={({ field }) => ( <FormItem><FormLabel>ID / Passport Number (*)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="identityIssuePlace" render={({ field }) => ( <FormItem><FormLabel>Issuing Place (*)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="identityIssueDate" render={({ field }) => (
                     <FormItem className="flex flex-col"><FormLabel>Issue Date (*)</FormLabel>
                       <Popover><PopoverTrigger asChild><FormControl>
                           <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                               {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                               <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                           </Button>
                       </FormControl></PopoverTrigger>
                       <PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date('1900-01-01')} initialFocus/>
                       </PopoverContent>
                       </Popover><FormMessage />
                     </FormItem>)}
                 />
                 <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number (*)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email (*)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Customer or Business Name (*)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="companyTaxCode" render={({ field }) => ( <FormItem><FormLabel>Tax Identification Number</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="companyAddress" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Headquarters Address</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem><FormLabel>Tags</FormLabel><FormControl><Input {...field} /></FormControl>
                       <FormDescription>Separate with commas.</FormDescription><FormMessage />
                    </FormItem>)}
                />
              </CardContent>
            </Card>
            
            {error && <p className='text-destructive text-sm font-medium'>{error}</p>}
            {success && <p className='text-green-600 text-sm font-medium'>{success}</p>}

            <div className="flex justify-end gap-4">
               <Button type="button" variant="outline" onClick={() => router.push('/customers')}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  )
} 












