'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PagedSuppliersResponse, SupplierStatus } from '@/types/supplier';
import { getAllSuppliers, deactivateSupplier, deleteSupplier } from '@/lib/supplier-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function SuppliersTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<PagedSuppliersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get('page') || '0');
  const size = Number(searchParams.get('size') || '10');
  const sortBy = searchParams.get('sortBy') || 'id';
  const sortDir = searchParams.get('sortDir') || 'asc';
  const keyword = searchParams.get('keyword') || '';
  const status = searchParams.get('status') as SupplierStatus || undefined;

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getAllSuppliers(page, size, sortBy, sortDir, keyword || undefined, status);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }, [page, size, sortBy, sortDir, keyword, status]);
  
  const handleSort = (newSortBy: string) => {
    const newSortDir = sortBy === newSortBy && sortDir === 'asc' ? 'desc' : 'asc';
    updateParams({ sortBy: newSortBy, sortDir: newSortDir, page: '0' });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKeyword = formData.get('keyword') as string;
    updateParams({ keyword: newKeyword, page: '0' });
  };

  const handleStatusChange = (newStatus: string) => {
    updateParams({ status: newStatus || undefined, page: '0' });
  };

  const updateParams = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(newParams)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDeactivate = async (id: number, companyName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${companyName}?`)) return;
    
    try {
      await deactivateSupplier(id);
      toast.success('Supplier deactivated successfully');
      // Refresh data
      window.location.reload();
    } catch (err: any) {
      toast.error(`Failed to deactivate supplier: ${err.message}`);
    }
  };

  const handleDelete = async (id: number, companyName: string) => {
    if (!confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) return;
    
    try {
      await deleteSupplier(id);
      toast.success('Supplier deleted successfully');
      // Refresh data
      window.location.reload();
    } catch (err: any) {
      toast.error(`Failed to delete supplier: ${err.message}`);
    }
  };

  if (error) return <div>Error: {error}</div>;

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              name="keyword"
              defaultValue={keyword}
              placeholder="Search by company name, contact person, or email..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        <Select value={status || ''} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('companyName')} className="cursor-pointer hover:bg-muted/50">
                Company Name
              </TableHead>
              <TableHead onClick={() => handleSort('contactPerson')} className="cursor-pointer hover:bg-muted/50">
                Contact Person
              </TableHead>
              <TableHead onClick={() => handleSort('email')} className="cursor-pointer hover:bg-muted/50">
                Email
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:bg-muted/50">
                Status
              </TableHead>
              <TableHead>Spare Part Types</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
            {isPending ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((supplier) => (
                <motion.tr key={supplier.id} variants={itemVariants} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{supplier.companyName}</TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        supplier.status === 'ACTIVE' ? 'default' : 
                        supplier.status === 'INACTIVE' ? 'destructive' : 'secondary'
                      }
                    >
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {supplier.spareParts.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {supplier.spareParts.slice(0, 2).map((sparePart) => (
                          <Badge key={sparePart.id} variant="outline" className="text-xs">
                            {sparePart.partName}
                          </Badge>
                        ))}
                        {supplier.spareParts.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{supplier.spareParts.length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No parts specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/suppliers/${supplier.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/suppliers/${supplier.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        {supplier.status === 'ACTIVE' && (
                          <DropdownMenuItem 
                            onClick={() => handleDeactivate(supplier.id, supplier.companyName)}
                            className="text-yellow-600"
                          >
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(supplier.id, supplier.companyName)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </motion.tbody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          Page {data ? data.pageNumber + 1 : 0} of {data?.totalPages ?? 0}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isPending || data?.pageNumber === 0}
            onClick={() => updateParams({ page: (page - 1).toString() })}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-2">Previous</span>
          </Button>
          <Button
            variant="outline"
            disabled={isPending || data?.last}
            onClick={() => updateParams({ page: (page + 1).toString() })}
          >
            <span className="mr-2">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}