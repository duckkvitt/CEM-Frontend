'use client';

import { FormEvent, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupplier } from '@/lib/supplier-service';
import { getAllSpareParts } from '@/lib/spare-parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { SparePart } from '@/types/spare-part';

export function CreateSupplierForm() {
  const router = useRouter();

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [selectedSparePartIds, setSelectedSparePartIds] = useState<Set<number>>(new Set());
  const [sparePartsLoading, setSparePartsLoading] = useState(true);
  const [sparePartsFilter, setSparePartsFilter] = useState('');

  // Fetch spare parts on component mount
  useEffect(() => {
    async function fetchSpareParts() {
      try {
        setSparePartsLoading(true);
        const response = await getAllSpareParts(0, 100); // Get first 100 spare parts
        setSpareParts(response.content.filter(sp => sp.status === 'ACTIVE'));
      } catch (err) {
        console.error('Error fetching spare parts:', err);
        toast.error('Failed to load spare parts');
      } finally {
        setSparePartsLoading(false);
      }
    }
    fetchSpareParts();
  }, []);

  const toggleSparePartSelection = useCallback((sparePartId: number) => {
    setSelectedSparePartIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(sparePartId)) {
        newSelection.delete(sparePartId);
      } else {
        newSelection.add(sparePartId);
      }
      return newSelection;
    });
  }, []);

  const filteredSpareParts = spareParts.filter(sparePart =>
    sparePart.partName.toLowerCase().includes(sparePartsFilter.toLowerCase()) ||
    sparePart.partCode.toLowerCase().includes(sparePartsFilter.toLowerCase())
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      // Basic client-side validation
      if (!payload.companyName) {
        setErrors({ companyName: ['Company name is required'] });
        setSubmitting(false);
        return;
      }

      if (!payload.contactPerson) {
        setErrors({ contactPerson: ['Contact person is required'] });
        setSubmitting(false);
        return;
      }

      if (!payload.email) {
        setErrors({ email: ['Email is required'] });
        setSubmitting(false);
        return;
      }

      if (!payload.phone) {
        setErrors({ phone: ['Phone is required'] });
        setSubmitting(false);
        return;
      }

      if (!payload.address) {
        setErrors({ address: ['Address is required'] });
        setSubmitting(false);
        return;
      }

      await createSupplier({
        companyName: payload.companyName as string,
        contactPerson: payload.contactPerson as string,
        email: payload.email as string,
        phone: payload.phone as string,
        fax: payload.fax as string || undefined,
        address: payload.address as string,
        taxCode: payload.taxCode as string || undefined,
        businessLicense: payload.businessLicense as string || undefined,
        website: payload.website as string || undefined,
        description: payload.description as string || undefined,
        sparePartIds: selectedSparePartIds.size > 0 ? Array.from(selectedSparePartIds) : undefined,
      });

      toast.success('Supplier created successfully');
      router.push('/suppliers');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      toast.error(`Failed to create supplier: ${message}`);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" name="companyName" />
              {errors?.companyName && <p className="text-sm text-red-500">{errors.companyName.join(', ')}</p>}
            </div>
            <div>
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input id="contactPerson" name="contactPerson" />
              {errors?.contactPerson && <p className="text-sm text-red-500">{errors.contactPerson.join(', ')}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" />
              {errors?.email && <p className="text-sm text-red-500">{errors.email.join(', ')}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" />
              {errors?.phone && <p className="text-sm text-red-500">{errors.phone.join(', ')}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fax">Fax</Label>
              <Input id="fax" name="fax" />
              {errors?.fax && <p className="text-sm text-red-500">{errors.fax.join(', ')}</p>}
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" placeholder="https://example.com" />
              {errors?.website && <p className="text-sm text-red-500">{errors.website.join(', ')}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea id="address" name="address" rows={3} />
            {errors?.address && <p className="text-sm text-red-500">{errors.address.join(', ')}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxCode">Tax Code</Label>
              <Input id="taxCode" name="taxCode" />
              {errors?.taxCode && <p className="text-sm text-red-500">{errors.taxCode.join(', ')}</p>}
            </div>
            <div>
              <Label htmlFor="businessLicense">Business License</Label>
              <Input id="businessLicense" name="businessLicense" />
              {errors?.businessLicense && <p className="text-sm text-red-500">{errors.businessLicense.join(', ')}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
            {errors?.description && <p className="text-sm text-red-500">{errors.description.join(', ')}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spare Parts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={sparePartsFilter}
              onChange={(e) => setSparePartsFilter(e.target.value)}
              placeholder="Search spare parts..."
              className="pl-10"
            />
          </div>

          {/* Selected spare parts display */}
          {selectedSparePartIds.size > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Selected Spare Parts ({selectedSparePartIds.size})
              </Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedSparePartIds).map((sparePartId) => {
                  const sparePart = spareParts.find(sp => sp.id === sparePartId);
                  return sparePart ? (
                    <Badge key={sparePartId} variant="secondary" className="flex items-center gap-1">
                      {sparePart.partName}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => toggleSparePartSelection(sparePartId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Spare parts selection list */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Available Spare Parts
            </Label>
            {sparePartsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading spare parts...</p>
              </div>
            ) : (
              <ScrollArea className="h-64 border rounded-md">
                <div className="p-4 space-y-2">
                  {filteredSpareParts.length > 0 ? (
                    filteredSpareParts.map((sparePart) => (
                      <div
                        key={sparePart.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                        onClick={() => toggleSparePartSelection(sparePart.id)}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedSparePartIds.has(sparePart.id)}
                            onCheckedChange={() => toggleSparePartSelection(sparePart.id)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {sparePart.partName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Code: {sparePart.partCode}
                          </p>
                          {sparePart.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {sparePart.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {sparePartsFilter ? 'No spare parts match your search' : 'No spare parts available'}
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? 'Creating...' : 'Create Supplier'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}