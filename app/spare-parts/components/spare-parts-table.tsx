'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PagedSparePartsResponse } from '@/types/spare-part';
import { getAllSpareParts } from '@/lib/spare-parts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { HideSparePartButton } from './hide-spare-part-button';
import { motion } from 'framer-motion';

export function SparePartsTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<PagedSparePartsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get('page') || '0');
  const size = Number(searchParams.get('size') || '10');
  const sortBy = searchParams.get('sortBy') || 'id';
  const sortDir = searchParams.get('sortDir') || 'asc';
  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getAllSpareParts(page, size, sortBy, sortDir); // Note: backend doesn't support keyword search yet
        setData(result);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }, [page, size, sortBy, sortDir]);
  
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

  const updateParams = (newParams: Record<string, string>) => {
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
        <div className="flex justify-between items-center mb-4">
            <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                    <Input name="keyword" defaultValue={keyword} placeholder="Search by name or code..." />
                    <Button type="submit">Search</Button>
                </div>
            </form>
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead onClick={() => handleSort('partName')}>Part Name</TableHead>
                <TableHead onClick={() => handleSort('partCode')}>Part Code</TableHead>
                <TableHead onClick={() => handleSort('quantityInStock')}>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead onClick={() => handleSort('status')}>Status</TableHead>
                <TableHead onClick={() => handleSort('supplier')}>Supplier</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                {isPending ? (
                    <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
                ) : (
                data?.content.map((part) => (
                    <motion.tr key={part.id} variants={itemVariants} className="hover:bg-muted/50">
                    <TableCell>{part.partName}</TableCell>
                    <TableCell>{part.partCode}</TableCell>
                    <TableCell>{part.quantityInStock}</TableCell>
                    <TableCell>{part.unitOfMeasurement}</TableCell>
                    <TableCell>
                        <Badge variant={part.status === 'ACTIVE' ? 'default' : 'destructive'}>
                        {part.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{part.supplier}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href={`/spare-parts/${part.id}`}>View Details</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href={`/spare-parts/${part.id}/edit`}>Edit</Link></DropdownMenuItem>
                                <HideSparePartButton id={part.id} />
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