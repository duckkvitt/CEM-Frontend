'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSparePart } from '@/lib/spare-parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SparePart } from '@/types/spare-part';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EditSparePartForm({ part }: { part: SparePart }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      // Basic client-side validation
      if (!payload.partName) {
        setErrors({ partName: ['Part name is required'] });
        setSubmitting(false);
        return;
      }

      await updateSparePart(part.id, {
        partName: payload.partName as string,
        description: payload.description as string,
        compatibleDevices: payload.compatibleDevices as string,
        quantityInStock: Number(payload.quantityInStock ?? 0),
        unitOfMeasurement: payload.unitOfMeasurement as string,
        supplier: payload.supplier as string,
        status: payload.status as 'ACTIVE' | 'INACTIVE',
      });

      router.push(`/spare-parts/${part.id}`);
    } catch (err: unknown) {
      setMessage(
        err instanceof Error ? `Failed to update spare part: ${err.message}` : 'Unexpected error'
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="partName">Part Name</Label>
          <Input id="partName" name="partName" defaultValue={part.partName} />
          {errors?.partName && <p className="text-sm text-red-500">{errors.partName.join(', ')}</p>}
        </div>
        <div>
          <Label htmlFor="quantityInStock">Quantity in Stock</Label>
          <Input id="quantityInStock" name="quantityInStock" type="number" defaultValue={part.quantityInStock} />
           {errors?.quantityInStock && <p className="text-sm text-red-500">{errors.quantityInStock.join(', ')}</p>}
        </div>
        <div>
          <Label htmlFor="unitOfMeasurement">Unit of Measurement</Label>
          <Input id="unitOfMeasurement" name="unitOfMeasurement" defaultValue={part.unitOfMeasurement} />
           {errors?.unitOfMeasurement && <p className="text-sm text-red-500">{errors.unitOfMeasurement.join(', ')}</p>}
        </div>
        <div>
            <Label htmlFor="compatibleDevices">Compatible Devices</Label>
            <Input id="compatibleDevices" name="compatibleDevices" defaultValue={part.compatibleDevices} />
            {errors?.compatibleDevices && <p className="text-sm text-red-500">{errors.compatibleDevices.join(', ')}</p>}
        </div>
        <div>
            <Label htmlFor="supplier">Supplier (optional)</Label>
            <Input id="supplier" name="supplier" defaultValue={part.supplier} />
            {errors?.supplier && <p className="text-sm text-red-500">{errors.supplier.join(', ')}</p>}
        </div>
         <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={part.status}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
           {errors?.status && <p className="text-sm text-red-500">{errors.status.join(', ')}</p>}
        </div>
      </div>
       <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={part.description} />
             {errors?.description && <p className="text-sm text-red-500">{errors.description.join(', ')}</p>}
        </div>
      
      <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>

      {message && <p className="text-sm text-red-500">{message}</p>}
    </form>
  );
} 